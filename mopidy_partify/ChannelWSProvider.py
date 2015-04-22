from __future__ import unicode_literals


import json
import logging
import re
import socket
import thread

from ws4py.client.tornadoclient import TornadoWebSocketClient
from tornado import ioloop

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)


class Provider(TornadoWebSocketClient):
    def __init__(self, uri, version, *kwargs):
        TornadoWebSocketClient.__init__(self, uri, kwargs)
        self.version = version

    def opened(self):
        # get public facing device ip
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()

        # send ip to service
        self.send
        (
            "penis"
        )

        # log that we've done that
        logger.info("[ChannelWSProvider][OPEN] registered")

    def closed(self, code, reason=None):
        logger.info
        (
            "[ChannelWSProvider][CLOSE] " + str(code) + " " + str(reason)
        )
        ioloop.IOLoop.instance().stop()

    def received_message(self, m):
        logger.info("[ChannelWSProvider][MSG] " + str(m))

    def connect_and_start(self):
        def run(*kwargs):
            self.connect()
            ioloop.IOLoop.instance().start()
        thread.start_new_thread(run, ())
