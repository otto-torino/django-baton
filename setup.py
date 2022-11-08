import os
from setuptools import setup

with open(os.path.join(os.path.dirname(__file__), 'README.md')) as readme:
    README = readme.read()

# allow setup.py to be run from any path
os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))

REPO_URL = 'http://github.com/otto-torino/django-baton'

setup(
    name='django-baton',
    version='2.6.0',
    packages=['baton', 'baton.autodiscover', 'baton.templatetags'],
    include_package_data=True,
    license='MIT License',
    description='A cool, modern and responsive django admin application',
    long_description=README,
    long_description_content_type='text/markdown',
    url=REPO_URL,
    author='abidibo',
    author_email='abidibo@gmail.com',
    extras_require={
        'analytics': [
            'google-auth',
            'google-auth-httplib2',
            'google-api-python-client',
            'requests',
        ]
    },
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'Intended Audience :: System Administrators',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Framework :: Django :: 2.1',
        'Framework :: Django :: 2.2',
        'Framework :: Django :: 3.0',
        'Framework :: Django :: 3.1',
        'Framework :: Django :: 4.0',
        'Topic :: Software Development',
        'Topic :: Software Development :: User Interfaces',
    ],
    project_urls={
        'Documentation': 'https://django-baton.readthedocs.io/en/latest/',
        'Demo': 'https://django-baton-demo.herokuapp.com/admin',
        'Source': REPO_URL,
        'Tracker': REPO_URL + '/issues',
    },
)
