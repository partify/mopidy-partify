from __future__ import unicode_literals

import json
import logging

import uuid

import pydblite as pydb

import tornado.web
import tornado.websocket

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
        others.append(self)

        self.write_message("Hello World")
        logger.info("Partify socket opened")

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
                        {'vtype': msg['vtype'], 'uri': msg['uri']}
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
        self.id = None
        logger.info("Partify socket closed")
