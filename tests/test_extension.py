from __future__ import unicode_literals

from mopidy_partify import PartifyExtension


def test_get_default_config():
    ext = PartifyExtension()

    config = ext.get_default_config()

    assert '[partify]' in config
    assert 'enabled = true' in config
    assert 'service = partify.io' in config
    assert 'room = dev' in config
    assert 'protected = false' in config


def test_get_config_schema():
    ext = PartifyExtension()

    schema = ext.get_config_schema()

    assert 'service' in schema
    assert 'room' in schema
    assert 'protected' in schema
