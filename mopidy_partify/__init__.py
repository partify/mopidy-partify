from __future__ import unicode_literals

import logging
import os
import pydblite as pydb
import uuid
import tornado.web
import tornado.websocket

from mopidy import config, ext

__version__ = '0.0.1'
__static_path__ = 'static'
__config_path__ = 'ext.conf'

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)
db = pydb.Base(os.path.join(os.path.dirname(__file__), "votes.pdl"))
db.create("id", "uri", "vote", mode="override")
others = []


class WSHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        self.id = uuid.uuid4()
        others.insert(self)

        self.write_message("Hello World")

    def on_message(self, message):
        if (hasattr(message, 'vtype')):
            db.insert(id=self.id, uri=message.uri, vote=message.vtype)
            self.write_message({'status': "OK"})
            self.updateOthers(self, message.vtype)
        else:
            self.write_message({'error': "specify vtype upvote or downvote"})

    def on_close(self):
        others.remove(self)

    def update_others(self, vtype):
        for other in others:
            if (other != self):
                other.write_message({'vtype': vtype})


def app_factory(config, core):
    return [
        (r'/ws', WSHandler),  # had this # {'core': core}),
        (
            r'/(.*)',
            tornado.web.StaticFileHandler,
            {'path': os.path.join(os.path.dirname(__file__), __static_path__)}
        )
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
