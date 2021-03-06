****************************
Mopidy-Partify
****************************

.. image:: https://img.shields.io/pypi/v/Mopidy-Partify.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-Partify/
    :alt: Latest PyPI version

.. image:: https://img.shields.io/pypi/dm/Mopidy-Partify.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-Partify/
    :alt: Number of PyPI downloads

.. image:: https://img.shields.io/travis/partify/mopidy-partify/master.png?style=flat
    :target: https://travis-ci.org/partify/mopidy-partify
    :alt: Travis CI build status

.. image:: https://img.shields.io/coveralls/partify/mopidy-partify/master.svg?style=flat
   :target: https://coveralls.io/r/partify/mopidy-partify?branch=master
   :alt: Test coverage

Mopidy extension for partify - crowdsourcing music at the party


Installation
============

Install by running::

    pip install Mopidy-Partify


Configuration
=============

Before starting Mopidy, you must add configuration for
Mopidy-Partify to your Mopidy configuration file::

    [partify]
    service = partify.io
    room = dev
    protected = false


Project resources
=================

- `Source code <https://github.com/partify/mopidy-partify>`_
- `Issue tracker <https://github.com/partify/mopidy-partify/issues>`_
- `Development branch tarball <https://github.com/partify/mopidy-partify/archive/master.tar.gz#egg=Mopidy-Partify-dev>`_


Changelog
=========

v0.0.1 (UNRELEASED)
----------------------------------------

- Initial release.
