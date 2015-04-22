from __future__ import unicode_literals


import json
import logging
import re
import socket

from ws4py.client.threadedclient import WebSocketClient

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)


# Since i'm a python noob let's just copy this here for now
def get_version(filename):
    content = open(filename).read()
    metadata = dict(re.findall("__([a-z]+)__ = '([^']+)'", content))
    return metadata['version']


class ChannelWSProvider(WebSocketClient):
    def opened(self):
        # get public facing device ip
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()

        # send ip to service
        self.send
        (
            json.dumps
            (
                {"ip": ip, "version": get_version('__init__.py')}
            )
        )

        # log that we've done that
        logger.info("[ChannelWSProvider][OPEN] registered")

    def closed(self, code, reason=None):
        logger.info("[ChannelWSProvider][CLOSE] " + code + reason)

    def received_message(self, m):
        logger.info("[ChannelWSProvider][MSG] " + m)
