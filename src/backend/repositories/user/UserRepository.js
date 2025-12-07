import { User } from '@/backend/models/users/User';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';


export default class UserRepository extends FirebaseRepository {
    
    constructor() {
        super(['users']);
    }

    // React hooks for real-time operations
    useUser(id) {
        const { data, loading, error } = super.useDocument(id);
        return {
            user: data ? new User(data) : null,
            loading,
            error
        };
    }


    useUserOnce(id) {
        const { data, loading, error } = super.useDocumentOnce(id);
        return {
            user: data ? new User(data) : null,
            loading,
            error
        };
    }

    useAllUsersOnce() {
        const { data, loading, error } = super.useCollectionOnce();
        return {
            users: data.map(u => new User(u)),
            loading,
            error
        };
    }
} 