from __future__ import unicode_literals

import logging
import os

import ChannelWSProvider

import VotingHandler

from mopidy import config, ext

__version__ = '0.2.1'
__static_path__ = 'static'
__config_path__ = 'ext.conf'

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)


def app_factory(config, core):
    return [
        (r'/voting', VotingHandler, {'core': core})
    ]


class PartifyExtension(ext.Extension):
    dist_name = 'Mopidy-Partify'
    ext_name = 'partify'
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), __config_path__)
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(PartifyExtension, self).get_config_schema()
        schema['service'] = config.Hostname()
        schema['room'] = config.String()
        schema['protected'] = config.Boolean()
        return schema

    def setup(self, registry):
        registry.add('http:app', {
            'name': self.ext_name,
            'factory': app_factory,
        })
        registry.add('http:static', {
            'name': self.ext_name,
            'path': os.path.join(os.path.dirname(__file__), __static_path__),
        })
        logger.info("Registered partify as http:static")

        ws = ChannelWSProvider('ws://partify.fm')
        ws.connect()
        ws.run_forever()
