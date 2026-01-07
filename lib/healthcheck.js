fetch('http://127.0.0.1:3000/api/healthcheck')
    .then((res) => {
        if (res.ok) {
            process.exit(0);
        }
        process.exit(1);
    })
    .catch(() => {
        process.exit(1);
    });
