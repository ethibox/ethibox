![](https://raw.githubusercontent.com/ston3o/ethibox/master/.github/background.jpg)

# Ethibox

[![](https://img.shields.io/github/tag/ston3o/ethibox.svg?label=version&style=flat-square&colorA=0d7377&colorB=44c2c7)](https://github.com/ston3o/ethibox/releases)
[![](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?style=flat-square&colorA=0d7377&colorB=44c2c7)](https://raw.githubusercontent.com/ston3o/ethibox/master/LICENSE.txt)
[![](https://img.shields.io/travis/ston3o/ethibox.svg?style=flat-square&colorA=0d7377&colorB=44c2c7)](https://travis-ci.org/ston3o/ethibox/branches)
[![](https://img.shields.io/codeclimate/maintainability/ston3o/ethibox.svg?style=flat-square&colorA=0d7377&colorB=44c2c7)](https://codeclimate.com/github/ston3o/ethibox)
[![](https://img.shields.io/badge/donate-liberapay-blue.svg?style=flat-square&colorA=0d7377&colorB=44c2c7)](https://liberapay.com/ston3o/donate)

##### [Website](https://ethibox.fr) | [Demo](https://demo.ethibox.fr) | [FAQ](https://ethibox.fr/faq) | [Contributing](https://github.com/ston3o/ethibox/blob/master/.github/CONTRIBUTING.md)

## Features

* [x] **WebUI**: Extensible & modular UI to provision, manage and scale your applications in one place.
* [x] **App Store**: Search, discover and install applications in one click.
* [x] **Auto-Scaling**: Auto-Scale your infrastructure.
* [x] **Let's Encrypt**: Free & automated certificates for each application.
* [x] **Kubernetes Support**: Manage your kubernetes Infrastructure On-Prem.
* [x] **Easy Domain Management**: Automated reverse-proxy installation. Create your vHosts in one click.
* [ ] **Payment System**: Become hoster and monetize your infrastrucutre.
* [ ] **Better Domain Management**: Buy, import and renew yours domains.
* [ ] **Automated Backup Management**: Backup your persistent storages automatically.
* [ ] **Unlimit Storage**: Decentralize storage with SIA.
* [ ] **VPN Support**: Configure public static IP to expose your applications behind NAT or firewall.
* [ ] **TOR Support**: Access your applications on TOR network.
* [ ] **Deploy Custom Packages**: Create and deploy custom packages easily.
* [ ] **Single Sign-on**: Single sign-on to access all apps.

## Getting Started

### Requirements

* [Kubernetes](https://github.com/kubernetes/kubernetes) - Production-Grade Container Scheduling and Management.
* [Node.js](https://github.com/nodejs/node) - JavaScript runtime.

### Installation

```bash
helm install --namespace kube-system --name ethibox https://charts.ethibox.fr/packages/ethibox-0.1.0.tgz
```

Go to `http://<IP-SERVER>:4444`

### Development

```
npm install
TOKEN=$TOKEN KUBE_APISERVER_IP=$KUBE_APISERVER_IP npm start
```

### Running the tests

```bash
npm test
```

## Contributing

Please read [CONTRIBUTING.md](https://github.com/ston3o/ethibox/blob/master/.github/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Support

Support me with a monthly donation and help me continue my activities:

[![liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/ston3o/donate)

Buy me a beer (BTC): [bitcoin:112aZxX9Jiya4TM6Le4foxTq9V8U6aVGbG](112aZxX9Jiya4TM6Le4foxTq9V8U6aVGbG)

## License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](https://raw.githubusercontent.com/ston3o/ethibox/master/LICENSE.txt) file for details

**Free Software, Hell Yeah!**
