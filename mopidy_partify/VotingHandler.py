from __future__ import unicode_literals

import json
import logging

import tornado.web

from zeroconf import ServiceBrowser

__service__ = "_partify._tcp.local."

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)


class MyListener(object):
    def __init__:
        self.port = None

    def remove_service(self, zeroconf, type, name):
        self.port = None

    def add_service(self, zeroconf, type, name):
        info = zeroconf.get_service_info(type, name)
        logger.info("[PORT]"+ str(info))
        self.port = 10


class Handler(tornado.web.RequestHandler):
    def initialize(self, core):
        self.core = core
        self.listener = MyListener()
        self.browser = ServiceBrowser(zeroconf, __service__, listener)

    def get(self):
        self.write(json.dumps({"port": self.listener.port}))