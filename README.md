<p align="center"><img width="15%" src="https://framapic.org/tUxf7mPC8HHU/zoDa3nLhs8HH.svg"></p>
<p align="center">Let's decentralize the internet!</p>
<p align="center">
  <a href=".github/CHANGELOG.md"><img src="https://img.shields.io/github/tag/ston3o/ethibox.svg?label=version&style=flat-square&colorA=0d7377&colorB=44c2c7"></a>
    &nbsp;
  <a href="LICENSE.txt"><img src="https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?style=flat-square&colorA=0d7377&colorB=44c2c7"></a>
    &nbsp;
  <a href="https://travis-ci.org/ston3o/ethibox/"><img src="https://img.shields.io/travis/ston3o/ethibox.svg?style=flat-square&colorA=0d7377&colorB=44c2c7"></a>
    &nbsp;
  <a href="https://codeclimate.com/github/ston3o/ethibox"><img src="https://img.shields.io/codeclimate/maintainability/ston3o/ethibox.svg?style=flat-square&colorA=0d7377&colorB=44c2c7"></a>
    &nbsp;
  <a href="https://fr.liberapay.com/"><img src="https://img.shields.io/badge/donate-liberapay-blue.svg?style=flat-square&colorA=0d7377&colorB=44c2c7"></a>
</p>

<div align="center">
  <h4>
    <a href="http://demo.ethibox.fr">Demo</a>
    <span> | </span>
    <a href="https://ethibox.fr">Website</a>
    <span> | </span>
    <a href=".github/CONTRIBUTING.md">Contributing</a>
    <span> | </span>
    <a href="https://www.reddit.com/r/ethibox/">Reddit</a>
    <span> | </span>
    <a href="https://webchat.freenode.net/?channels=ethibox">Chat</a>
  </h4>
</div>

<div align="center">
  <sub>Built with <span style="color:red">❤︎</span> by
  <a href="https://ston3o.me">ston3o</a> and
  <a href="https://github.com/ston3o/ethibox/graphs/contributors">contributors</a>
</div>

---

## Why ?

- Because internet is centralized and lack of privacy
- Because it's not easy to self-hosted
- Because free software ❤︎

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Requirements

* [Minikube](https://github.com/kubernetes/minikube) - Run Kubernetes locally.
* [Telepresence](https://github.com/datawire/telepresence/) - Local development against a remote Kubernetes.
* [Node.js](https://github.com/nodejs/node) - Node.js

### Installation

```bash
minikube start
make install
make enter
make dev
```

## How it works

```
         ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
         │                      ┌──────────┐                                               │
         │                  ┌──▶│ Mastodon │◀──┐                                           │
         │                  │   └──────────┘   │                                           │
         │                  │                  │                                           │
      80,443   ┌─────────┐  │   ┌──────────┐   │  ┌────────────────┐    ┌──────────────┐   │
User ─────────▶│ traefik │─────▶│ Ghost    │◀─────│ Kubernetes API │◀───│ Helm + swift │   │
         │     └─────────┘  │   └──────────┘   │  └────────────────┘    └──────────────┘   │
         │          │       │                  │           ▲                   ▲           │
         │          │       │   ┌──────────┐   │           │                   │           │
         │          │       └──▶│ ∞        │◀──┘           │                   │           │
         │          │           └──────────┘               │                   │           │
         │          │                                      │                   │           │
         │          │ Port 4444 ┌──────────┐               │      charts       │           │
         │          └──────────▶│ Ethibox  │───────────────┘───────────────────┘           │
         │                      └──────────┘                                               │
         │                                                               Bare metal server │
         └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Deployment

```bash
kubectl apply -f https://raw.githubusercontent.com/ston3o/ethibox/master/ethibox.yaml
```

## Running the tests

```bash
make start-selenium
make test
```

## Built With

* [Kubernetes](https://github.com/kubernetes/kubernetes) - Production-Grade Container Scheduling and Management.
* [helm](https://github.com/kubernetes/helm) - The Kubernetes Package Manager.
* [React](https://github.com/facebook/react) - A declarative, efficient, and flexible JavaScript library for building user interfaces.
* [Redux](https://github.com/reactjs/redux) - Predictable state container for JavaScript apps.
* [Express](https://github.com/expressjs/express) - Fast, unopinionated, minimalist web framework for node.
* [Semantic UI](https://github.com/semantic-org/semantic-ui) - UI component framework based around useful principles from natural language.

## Todo

- [ ] Add units tests
- [ ] Add domain name system - Create/edit applications vhost from client
- [ ] Add let's encrypt feature - Enable/Disable let's encrypt button for each applications
- [ ] Add TOR feature - Enable/Disable tor button for each applications
- [ ] Add password manager feature - Generate user and password account for each applications with account support
- [ ] Add update system feature
- [ ] Add Sign up / Sign in feature
- [ ] Add WAF & IDS
- [ ] Add backup system - Import/export applications
- [ ] Update logo design

## Contributing

Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Donate

Buy me a beer (BTC): 112aZxX9Jiya4TM6Le4foxTq9V8U6aVGbG

## License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](LICENSE.txt) file for details

**Free Software, Hell Yeah!**
