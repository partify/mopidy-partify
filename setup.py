from __future__ import unicode_literals

import re

from setuptools import find_packages, setup


def get_version(filename):
    content = open(filename).read()
    metadata = dict(re.findall("__([a-z]+)__ = '([^']+)'", content))
    return metadata['version']


setup(
    name='Mopidy-Partify',
    version=get_version('mopidy_partify/__init__.py'),
    url='https://github.com/bengreenier/mopidy-partify',
    license='Apache License, Version 2.0',
    author='Ben Greenier',
    author_email='ben@bengreenier.com',
    description='Mopidy extension for partify - crowdsourcing music at the party',  # noqa
    long_description=open('README.rst').read(),
    packages=find_packages(exclude=['tests', 'tests.*']),
    zip_safe=False,
    include_package_data=True,
    install_requires=[
        'setuptools',
        'Mopidy >= 0.18',
        'Pykka >= 1.1',
        'pydblite >= 3.0',
        'uuid >= 1.3',
        'websocket-client >= 0.29'
    ],
    entry_points={
        'mopidy.ext': [
            'partify = mopidy_partify:PartifyExtension',
        ],
    },
    classifiers=[
        'Environment :: No Input/Output (Daemon)',
        'Intended Audience :: End Users/Desktop',
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 2',
        'Topic :: Multimedia :: Sound/Audio :: Players',
    ],
)
