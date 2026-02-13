/**
 * EngineService — Hidden WebView running Stockfish WASM
 *
 * Renders a zero-size WebView that loads stockfish-worker.html.
 * Communicates with the game store via postMessage bridge.
 *
 * Usage: Mount <EngineService /> once in your app. It subscribes to
 * the game store and automatically evaluates when isEvaluating is true.
 *
 * Asset Loading Strategy:
 * - Uses expo-asset to download both stockfish-worker.html and stockfish.js.bin
 * - Copies them to the same cache directory so relative <script src="stockfish.js"> resolves
 * - Loads the HTML via file:// URI for correct resource resolution
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Paths, File, Directory } from 'expo-file-system';
import { useGameStore } from '@/stores/gameStore';
import { parseUCIInfo, classifyEval, DEFAULT_DEPTH } from './EvaluationController';

interface EngineMessage {
    type: 'loaded' | 'ready' | 'info' | 'bestmove' | 'error';
    data?: string;
    move?: string;
    message?: string;
}

export default function EngineService() {
    const webViewRef = useRef<WebView>(null);
    const isEngineReady = useRef(false);
    const lastEvalFen = useRef<string | null>(null);

    // The local file:// URI for the HTML page (null until assets prepared)
    const [htmlUri, setHtmlUri] = useState<string | null>(null);

    // Subscribe to store state
    const isEvaluating = useGameStore((s) => s.isEvaluating);
    const fen = useGameStore((s) => s.fen);
    const sessionStatus = useGameStore((s) => s.sessionStatus);
    const updateEvaluation = useGameStore((s) => s.updateEvaluation);
    const setEngineReady = useGameStore((s) => s.setEngineReady);

    /**
     * Prepare engine assets: download both files from expo-asset
     * and copy them to a cache directory side-by-side so the HTML's
     * relative <script src="stockfish.js"> resolves correctly.
     */
    useEffect(() => {
        let cancelled = false;

        async function prepareAssets() {
            try {
                // Create engine directory in cache
                const engineDir = new Directory(Paths.cache, 'stockfish-engine');
                if (!engineDir.exists) {
                    engineDir.create({ intermediates: true });
                }

                // --- Download HTML asset via expo-asset ---
                const htmlAsset = Asset.fromModule(
                    require('@/assets/stockfish/stockfish-worker.html')
                );
                await htmlAsset.downloadAsync();

                if (cancelled) return;

                // Always overwrite HTML — it may have been updated
                const htmlDest = new File(engineDir, 'stockfish-worker.html');
                if (htmlAsset.localUri) {
                    if (htmlDest.exists) htmlDest.delete();
                    const srcHtml = new File(htmlAsset.localUri);
                    srcHtml.copy(htmlDest);
                }

                // --- Download stockfish.js.bin asset and place as stockfish.js ---
                // Only copy if not already present (large file, rarely changes)
                const sfDest = new File(engineDir, 'stockfish.js');
                if (!sfDest.exists) {
                    const sfAsset = Asset.fromModule(
                        require('@/assets/stockfish/stockfish.js.bin')
                    );
                    await sfAsset.downloadAsync();

                    if (cancelled) return;

                    if (sfAsset.localUri) {
                        const srcSf = new File(sfAsset.localUri);
                        srcSf.copy(sfDest);
                    }
                }

                if (cancelled) return;

                // Verify HTML exists and set the URI for WebView
                if (htmlDest.exists) {
                    setHtmlUri(htmlDest.uri);
                    console.log(`[EngineService] Assets ready — HTML: ✓, SF: ${sfDest.exists ? '✓' : '✗'}`);
                } else {
                    console.error('[EngineService] Failed to prepare HTML asset');
                }
            } catch (err) {
                console.error('[EngineService] Failed to prepare assets:', err);
            }
        }

        prepareAssets();
        return () => { cancelled = true; };
    }, []);

    /**
     * Send a JSON message to the WebView
     */
    const sendToEngine = useCallback((msg: object) => {
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify(msg));
        }
    }, []);

    /**
     * Handle messages coming from the Stockfish WebView
     */
    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        const raw = event.nativeEvent.data;

        // Ignore non-JSON messages — Stockfish sends raw UCI text
        // (e.g. "Unknown command", "id name Stockfish", etc.)
        if (!raw || raw[0] !== '{') {
            return;
        }

        try {
            const msg: EngineMessage = JSON.parse(raw);

            switch (msg.type) {
                case 'loaded':
                    sendToEngine({ type: 'init' });
                    break;

                case 'ready':
                    isEngineReady.current = true;
                    setEngineReady(true);
                    console.log('[EngineService] Stockfish ready');
                    break;

                case 'info':
                    if (msg.data) {
                        const info = parseUCIInfo(msg.data);
                        if (info && info.depth >= 8) {
                            // Stockfish reports from side-to-move's perspective.
                            // The store expects scores from WHITE's perspective,
                            // so negate if it's Black's turn.
                            const currentFen = useGameStore.getState().fen;
                            const sideToMove = currentFen ? currentFen.split(' ')[1] : 'w';
                            const whiteScore = sideToMove === 'b' ? -info.scoreCp : info.scoreCp;

                            const scorePawns = whiteScore / 100;
                            const status = classifyEval(scorePawns);
                            updateEvaluation({
                                scoreCp: whiteScore,
                                scorePawns,
                                bestMove: info.bestMove,
                                depth: info.depth,
                                status,
                            });
                        }
                    }
                    break;

                case 'bestmove':
                    if (msg.move) {
                        // Add a short delay to simulate "thinking" for better UX
                        setTimeout(() => {
                            const { makeBotMove } = useGameStore.getState();
                            makeBotMove(msg.move!);
                        }, 600);
                    }
                    break;

                case 'error':
                    console.warn('[EngineService] Engine error:', msg.message);
                    break;
            }
        } catch (err) {
            // Silently ignore — likely raw UCI output that slipped through
        }
    }, [sendToEngine, updateEvaluation, setEngineReady]);

    /**
     * Reset lastEvalFen when a new session starts so the engine always
     * evaluates the initial position — even if the FEN is the same as
     * a previous session. Without this, the dedup check below would
     * prevent the engine from running, and the bot would never move.
     */
    useEffect(() => {
        if (sessionStatus === 'active') {
            lastEvalFen.current = null;
        }
    }, [sessionStatus]);

    /**
     * When isEvaluating becomes true and FEN changes, send evaluation request
     */
    useEffect(() => {
        if (isEvaluating && fen && isEngineReady.current && fen !== lastEvalFen.current) {
            lastEvalFen.current = fen;
            sendToEngine({
                type: 'evaluate',
                fen: fen,
                depth: DEFAULT_DEPTH,
            });
        }
    }, [isEvaluating, fen, sendToEngine]);

    /**
     * Handle WebView crash — attempt to restart
     */
    const handleError = useCallback(() => {
        console.error('[EngineService] WebView error — will retry on next evaluation');
        isEngineReady.current = false;
        setEngineReady(false);
    }, [setEngineReady]);

    // Don't render WebView until assets are prepared
    if (!htmlUri) {
        return null;
    }

    return (
        <View style={{ width: 0, height: 0, overflow: 'hidden' }} pointerEvents="none">
            <WebView
                ref={webViewRef}
                source={{ uri: htmlUri }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                onMessage={handleMessage}
                onError={handleError}
                onContentProcessDidTerminate={handleError}
                style={{ width: 0, height: 0 }}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
            />
        </View>
    );
}
