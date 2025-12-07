import { useState } from 'react';

/**
 * A custom hook for handling asynchronous actions with loading state
 * @param {Function} asyncAction - The asynchronous function to execute
 * @returns {[Function, boolean]} - A tuple containing the execute function and loading state
 */
export default function useAsyncAction(asyncAction) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = async (...args) => {
        setIsLoading(true);
        setError(null);
        try {
            await asyncAction(...args);
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return [execute, isLoading, error];
} 