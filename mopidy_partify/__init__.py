from __future__ import unicode_literals

import json
import logging
import os

import uuid

from mopidy import config, core, ext

import pydblite as pydb

import tornado.web
import tornado.websocket


__version__ = '0.0.12'
__static_path__ = 'static'
__config_path__ = 'ext.conf'

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)
db = pydb.Base("votes.pdl", save_to_file=False)
db.create("id", "uri", "vote", mode="override")
others = []


class WSHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        self.id = uuid.uuid4()
        self.core = core
        others.append(self)

        self.write_message("Hello World")
        logger.info("Partify socket opened")

    def on_message(self, message):
        msg = json.loads(message)
        if ('vtype' in msg and 'uri' in msg):
            db.insert(id=self.id, uri=msg['uri'], vote=msg['vtype'])
            db.commit()
            self.write_message({'status': "OK"})
            for other in others:
                if (other.id != self.id):
                    other.write_message
                    (
                        {'vtype': msg['vtype'], 'uri': msg['uri']}
                    )
            votes = db(vote=msg['vtype'], uri=msg['uri'])
            if (
                msg['vtype'] == "downvote"
                and
                votes.len() >= (others.len() / 2)
            ):
                self.core.playback.next()
                db.delete(votes)
            logger.info
            (
                "Partify got valid vote ["+msg['vtype']+" "+msg['uri']+"]"
            )
        else:
            logger.info("Partify got invalid vote ["+msg+"]")
            self.write_message
            (
                {
                    'error':
                    "msg should have {vtype:'upvote'||'downvote', uri:''}"
                }
            )

    def on_close(self):
        if others.count(self) > 0:
            others.remove(self)
        logger.info("Partify socket closed")


def app_factory(config, core):
    return [
        (r'/ws', WSHandler)
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
