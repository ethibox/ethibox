# Ethibox

[![Version](https://img.shields.io/github/v/tag/ethibox/ethibox.svg?colorA=181C31&colorB=212839&label=version&sort=semver&style=flat-square)](https://github.com/ethibox/ethibox/releases)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?style=flat-square&colorA=181C31&colorB=212839)](https://raw.githubusercontent.com/ethibox/ethibox/master/LICENSE.txt)
[![Github Workflow](https://img.shields.io/github/workflow/status/ethibox/ethibox/Build%20and%20deploy?style=flat-square&colorA=181C31&colorB=212839)](https://github.com/ethibox/ethibox/actions)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/ethibox/ethibox.svg?style=flat-square&colorA=181C31&colorB=212839)](https://codeclimate.com/github/ethibox/ethibox)

Ethibox is an open-source web apps hoster, a simple UI to install & update open-source web apps.

## Prerequisites

- Docker Swarm
- Portainer
- Node.js

## Installation

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
```

## Deployment

```bash
docker stack deploy -c ethibox.yml ethibox
```

## Running the tests

```bash
npm test
```

## Contributing

We welcome contributions in all forms. Please check out the [contributing guide](https://github.com/ethibox/ethibox/blob/master/.github/CONTRIBUTING.md) for more information.

Participation in this project is subject to a [code of conduct](https://github.com/ethibox/ethibox/blob/master/.github/CODE_OF_CONDUCT.md).

## License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](https://raw.githubusercontent.com/ethibox/ethibox/master/LICENSE.txt) file for details

**Free Software, Hell Yeah!**
