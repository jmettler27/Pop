import { useState } from 'react';

export function useAsyncAction(asyncAction) {
    const [isLoading, setIsLoading] = useState(false);

    const execute = async (...args) => {
        setIsLoading(true);
        try {
            await asyncAction(...args);
        } finally {
            setIsLoading(false);
        }
    };

    return [execute, isLoading];
}

