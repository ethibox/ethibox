import express from 'express';
import jwtDecode from 'jwt-decode';
import graphqlHTTP from 'express-graphql';
import { makeExecutableSchema } from 'graphql-tools';
import { User } from './models';
import { isAuthenticate, getSettings } from './utils';
import typeDefs from './schema.graphql';
import { applicationsQuery,
    userQuery,
    settingsQuery,
    packagesQuery,
    installApplicationMutation,
    uninstallApplicationMutation,
    editDomainNameApplicationMutation,
    subscribeMutation,
    unsubscribeMutation,
    registerMutation,
    loginMutation,
    updatePasswordMutation,
    updateAdminSettingsMutation,
} from './resolvers';

const resolvers = {
    Query: {
        applications: applicationsQuery,
        user: userQuery,
        settings: settingsQuery,
        packages: packagesQuery,
    },
    Mutation: {
        installApplication: installApplicationMutation,
        uninstallApplication: uninstallApplicationMutation,
        editDomainNameApplication: editDomainNameApplicationMutation,
        subscribe: subscribeMutation,
        unsubscribe: unsubscribeMutation,
        register: registerMutation,
        login: loginMutation,
        updatePassword: updatePasswordMutation,
        updateAdminSettings: updateAdminSettingsMutation,
    },
};

const app = express();

app.use('/', async (req, res, next) => {
    req.user = false;
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (isAuthenticate(token)) {
        const { userId } = jwtDecode(token);
        req.user = await User.findOne({ where: { id: userId } }) || false;
    }

    req.settings = await getSettings();

    return next();
});

app.use('/', (req, res) => graphqlHTTP({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    context: { req, res },
    graphiql: (process.env.NODE_ENV !== 'production'),
    formatError: err => err.message,
})(req, res));

export default app;
