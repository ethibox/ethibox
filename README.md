# Ethibox

[![Version](https://img.shields.io/github/v/tag/ethibox/ethibox.svg?colorA=181C31&colorB=212839&label=version&sort=semver&style=flat-square)](https://github.com/ethibox/ethibox/releases)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?style=flat-square&colorA=181C31&colorB=212839)](https://raw.githubusercontent.com/ethibox/ethibox/master/LICENSE.txt)
[![Github Workflow](https://img.shields.io/github/workflow/status/ethibox/ethibox/Build%20and%20deploy?style=flat-square&colorA=181C31&colorB=212839)](https://github.com/ethibox/ethibox/actions)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/ethibox/ethibox.svg?style=flat-square&colorA=181C31&colorB=212839)](https://codeclimate.com/github/ethibox/ethibox)

Ethibox is an open-source web apps hoster. Host and share the most popular open-source web apps for your friends and/or your clients.

![screenshot](https://raw.githubusercontent.com/ethibox/ethibox/master/static/screenshot.jpg)

## Installation

```bash
docker run --name ethibox -p 3000:3000 ethibox/ethibox
```

## Development

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#Deployment) to deploy the project on a live system.

To clone and run this application, you'll need Git and Node.js (which comes with npm) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/ethibox/ethibox

# Go into the repository
cd ethibox

# Install dependencies
yarn

# Initialize database
npm run migrate

# Copy environment variables
cp .env.dist .env

# Run the app
npm start

# Go to http://localhost:8080
```

## Running the tests

```bash
npm test
```

## Contributing

We welcome contributions in all forms. Please check out the [contributing guide](https://github.com/ethibox/ethibox/blob/master/.github/CONTRIBUTING.md) for more information.

Participation in this project is subject to a [code of conduct](https://github.com/ethibox/ethibox/blob/master/.github/CODE_OF_CONDUCT.md).

## Support

I'd love to work on this project, but my time on this earth is limited, support my work to give me more time!

Please support me with a one-time or a monthly donation and help me continue my activities.

[![Github sponsor](https://img.shields.io/badge/github-Support%20my%20work-lightgrey?style=social&logo=github)](https://github.com/sponsors/johackim/)
[![ko-fi](https://img.shields.io/badge/ko--fi-Support%20my%20work-lightgrey?style=social&logo=ko-fi)](https://ko-fi.com/johackim)
[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-Support%20my%20work-lightgrey?style=social&logo=buy%20me%20a%20coffee&logoColor=%23FFDD00)](https://www.buymeacoffee.com/johackim)
[![liberapay](https://img.shields.io/badge/liberapay-Support%20my%20work-lightgrey?style=social&logo=liberapay&logoColor=%23F6C915)](https://liberapay.com/johackim/donate)
[![Github](https://img.shields.io/github/followers/johackim?label=Follow%20me&style=social)](https://github.com/johackim)
[![Mastodon](https://img.shields.io/mastodon/follow/1631?domain=https%3A%2F%2Fmastodon.ethibox.fr&style=social)](https://mastodon.ethibox.fr/@johackim)
[![Twitter](https://img.shields.io/twitter/follow/_johackim?style=social)](https://twitter.com/_johackim)

## License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](https://raw.githubusercontent.com/ethibox/ethibox/master/LICENSE.txt) file for details

**Free Software, Hell Yeah!**
