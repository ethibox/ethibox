<p align="center"><img width="15%" src="https://framapic.org/tUxf7mPC8HHU/zoDa3nLhs8HH.svg"></p>
<p align="center">The Easiest Way to Deploy Websites</p>
<p align="center">
  <a href=".github/CHANGELOG.md"><img src="https://img.shields.io/badge/version-0.1.0-blue.svg?style=flat-square&colorA=0d7377&colorB=44c2c7"></a>
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
    <a href="https://demo.ethibox.fr">Demo</a>
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

<!-- ## TL;DR -->

<!-- ```bash -->
<!-- kubectl apply -f https://raw.githubusercontent.com/ston3o/ethibox/master/ethibox.yaml -->
<!-- ``` -->

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* [minikube](https://github.com/kubernetes/minikube) - Run Kubernetes locally.
* [telepresence](https://github.com/datawire/telepresence/) - Local development against a remote Kubernetes.

### Installation

```bash
minikube start
make install
make enter
make dev
```

## How it works

<p align="center"><img src="https://framapic.org/ewfzU8WzgIr3/iaeIIIxMGLh3.png"></p>

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

## Todo

- [ ] Add image previsualisation and about application (tooltip)
- [ ] Add more Applications
- [ ] Improve release install/uninstall
- [ ] Add ethibox kubernetes namespace
- [ ] Add domain name system
- [ ] Add units tests
- [ ] Add update system
- [ ] Add PersistentVolume system
- [ ] Add password manager
- [ ] Add user sessions
- [ ] Remove Swift
- [ ] Replace Express

## Contributing

Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Donate

Buy me a beer (BTC): 112aZxX9Jiya4TM6Le4foxTq9V8U6aVGbG

## License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](LICENSE.txt) file for details

**Free Software, Hell Yeah!**
