import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../Firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';

export const useGlobalUser = () => {
    const [state, setStateInternal] = useState({
        user: null,
        isAdmin: false,
        funds: 0,
        holdings: {},
        watchlist: {},
        isAuthenticated: false
    });

    const setState = useCallback(async (newState) => {
        if (!auth.currentUser) return;

        try {
            // If it's a function, get the new state
            const actualNewState = typeof newState === 'function' ? newState(state) : newState;

            // Update Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                funds: actualNewState.funds,
                holdings: actualNewState.holdings,
                watchlist: actualNewState.watchlist
            });

            // If this is a trade, record the transaction
            if (actualNewState.lastTrade) {
                const { type, symbol, quantity, price, total, instrumentKey, exchange, segment, avgPrice, remainingQuantity } = actualNewState.lastTrade;

                const timestamp = new Date().getTime();

                // Add transaction record
                const transactionRef = collection(db, "users", auth.currentUser.uid, "transactions");
                await setDoc(doc(transactionRef), {
                    type,
                    symbol,
                    quantity,
                    price,
                    total,
                    timestamp,
                    instrumentKey,
                    exchange,
                    segment,
                    avgPrice,
                    remainingQuantity
                });

                // Add to stock history
                const historyRef = collection(db, "users", auth.currentUser.uid, "stockHistory");
                await setDoc(doc(historyRef, instrumentKey), {
                    lastUpdated: timestamp,
                    symbol,
                    exchange,
                    segment,
                    trades: [{
                        type,
                        quantity,
                        price,
                        total,
                        timestamp,
                        avgPrice,
                        remainingQuantity
                    }]
                }, { merge: true });

                // Remove lastTrade from state as it's been processed
                delete actualNewState.lastTrade;
            }

            // Update local state
            setStateInternal(actualNewState);
        } catch (error) {
            console.error('Error updating user data:', error);
            throw error;
        }
    }, [state]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setStateInternal({
                            user: user,
                            isAdmin: userData.isAdmin || false,
                            funds: userData.funds || 0,
                            holdings: userData.holdings || {},
                            watchlist: userData.watchlist || {},
                            isAuthenticated: true
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setStateInternal({
                        user: null,
                        isAdmin: false,
                        funds: 0,
                        holdings: {},
                        watchlist: {},
                        isAuthenticated: false
                    });
                }
            } else {
                setStateInternal({
                    user: null,
                    isAdmin: false,
                    funds: 0,
                    holdings: {},
                    isAuthenticated: false
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return [state, setState];
};
