from __future__ import unicode_literals

import httplib
import json
import logging
import os

import uuid

from mopidy import config, ext

import pydblite as pydb

import tornado.web
import tornado.websocket


__version__ = '0.1.1'
__static_path__ = 'static'
__config_path__ = 'ext.conf'

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)
db = pydb.Base("votes.pdl", save_to_file=False)
db.create("id", "uri", "vote", mode="override")
others = []


class WSHandler(tornado.websocket.WebSocketHandler):
    def initialize(self, core):
        self.core = core

    def open(self):
        self.id = uuid.uuid4()

        conn = httplib.HTTPConnection("usernames.io")
        conn.request("GET", "/")
        res = conn.getresponse()
        data = res.read()
        msg = json.loads(data)

        self.username = msg.username

        self.write_message({'id': self.id, 'username': self.username})

        for other in others:
                if (other.id != self.id):
                    other.write_message
                    (
                        {
                            'status': "ONLINE",
                            'user': self.username
                        }
                    )

        others.append(self)

        logger.info
        (
            "Partify socket["+self.id+"] opened for u["+self.username+"]"
        )

    def on_message(self, message):
        msg = json.loads(message)
        if ('vtype' in msg and 'uri' in msg):
            logger.info
            (
                "Partify got valid vote ["+msg['vtype']+" "+msg['uri']+"]"
            )
            db.insert(id=self.id, uri=msg['uri'], vote=msg['vtype'])
            db.commit()
            self.write_message({'status': "OK"})
            for other in others:
                if (other.id != self.id):
                    other.write_message
                    (
                        {
                            'vtype': msg['vtype'],
                            'uri': msg['uri'],
                            'user': self.username
                        }
                    )
            votes = db(vote=msg['vtype'], uri=msg['uri'])
            if (
                msg['vtype'] == "downvote"
                and
                len(votes) >= (len(others) / 2)
            ):
                logger.info("Partify skipping track")
                self.core.playback.next()
                db.delete(votes)
            logger.info("Partify processed vote")
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
        db.delete(db(id=self.id))

        for other in others:
                if (other.id != self.id):
                    other.write_message
                    (
                        {
                            'status': "OFFLINE",
                            'user': self.username
                        }
                    )

        self.id = None
        logger.info("Partify socket closed")


def app_factory(config, core):
    return [
        (r'/ws', WSHandler, {'core': core})
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
