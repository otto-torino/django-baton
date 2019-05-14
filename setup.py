import os
from setuptools import setup

with open(os.path.join(os.path.dirname(__file__), 'README.md')) as readme:
    README = readme.read()

# allow setup.py to be run from any path
os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))

setup(
    name='django-baton',
    version='1.5.1',
    packages=['baton', 'baton.autodiscover', 'baton.templatetags'],
    include_package_data=True,
    license='MIT License',
    description='A cool, modern and responsive django admin application',
    long_description=README,
    long_description_content_type='text/markdown',
    url='http://github.com/otto-torino/django-baton',
    author='abidibo',
    author_email='abidibo@gmail.com',
    install_requires=[
        'google-api-python-client',
        'oauth2client==1.5.2',
    ],
    classifiers=[
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'Intended Audience :: System Administrators',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.5',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3.2',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.5',
        'Topic :: Software Development',
        'Topic :: Software Development :: User Interfaces',
    ]
)
