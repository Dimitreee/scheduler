import { config } from '@keystone-next/keystone/schema';
import redis from 'redis';
import { storedSessions } from '@keystone-next/keystone/session';
import { createAuth } from '@keystone-next/auth';
import { redisSessionStore } from '@keystone-next/session-store-redis';

import { lists } from './schema';

let sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            'The SESSION_SECRET environment variable must be set in production'
        );
    } else {
        sessionSecret = '-- DEV COOKIE SECRET; CHANGE ME --';
    }
}

let sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

const { withAuth } = createAuth({
    listKey: 'User',
    identityField: 'email',
    secretField: 'password',
    sessionData: 'name',
    initFirstItem: {
        fields: ['name', 'email', 'password'],
    },
});

export default withAuth(
    config({
        lists,
        db: {
            adapter: 'prisma_postgresql',
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432',
        },
        ui: {
            isAccessAllowed: (context) => !!context.session?.data,
        },
        session: storedSessions({
            store: redisSessionStore({
                    client: redis.createClient(6379),
                }
            ),
            maxAge: sessionMaxAge,
            secret: sessionSecret,
        }),
        graphql: {
            debug: process.env.NODE_ENV !== 'production',
            queryLimits: { maxTotalResults: 100 },
            apolloConfig: {
                playground: process.env.NODE_ENV !== 'production',
                /* ... */
            },
        },
    }),
);
