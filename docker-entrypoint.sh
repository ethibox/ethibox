#!/bin/sh

set -e

find . -maxdepth 1 -name schema.prisma -exec mv -f {} /app/prisma/ \;

if [ -n "$MYSQL_HOST" ] && [ -n "$MYSQL_USER" ] && [ -n "$MYSQL_PASSWORD" ] && [ -n "$MYSQL_DATABASE" ]; then
    sed -i -e "s/sqlite/mysql/" /app/prisma/schema.prisma
    sed -i -e "s#file:./data.db#mysql://$MYSQL_USER:$MYSQL_PASSWORD@$MYSQL_HOST:3306/$MYSQL_DATABASE#g" /app/prisma/schema.prisma
fi

if [ -n "$SECRET" ]; then
    echo "SECRET=$SECRET" >> /app/.env
fi

npm run migrate

exec "$@"
