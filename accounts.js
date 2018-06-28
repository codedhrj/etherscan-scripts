#!/usr/bin/env node
"use strict";

const Async = require('async');
const Request = require('request');
const Cheerio = require('cheerio');

const URL = 'https://etherscan.io/accounts/';
const BUCKET = 100;

var isAddress = function (address) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        // check if it has the basic requirements of an address
        return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        // If it's all small caps or all all caps, return true
        return true;
    } else {
        // Otherwise check each case
        return isChecksumAddress(address);
    }
};

var isChecksumAddress = function (address) {
    // Check each case
    address = address.replace('0x', '');
    var addressHash = sha3(address.toLowerCase());
    for (var i = 0; i < 40; i++) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
            return false;
        }
    }
    return true;
};

const Accounts = {
    get: function (pages, offset, cb) {
        var pagesIndex = Array.from(Array(pages).keys());
        let addresses = [];
        Async.eachLimit(pagesIndex, 5, function(index, callback) {
            const url = URL + (index + 1 + offset) + '?ps=100';
            Request.get(url, function (err, response) {
                if (err) {
                    return callback(err);
                }
                const $ = Cheerio.load(response.body);
                $('tr').children('td:nth-child(2)').each(function () {
                    let address = $(this).text();
                    address = address.split('|')[0];
                    address = address.replace(/\s/g, '');

                    if(isAddress(address)) {
                        addresses.push(address);
                    }
                });
                return callback();
            });
        }, function(err) {
            return cb(err, addresses)
        } );

    }
};

module.exports = Accounts;

(function () {
    if (require.main === module) {
        const pages = 10;
        Accounts.get(pages, 120, function(err, accounts) {
            console.log(accounts.length);
        });
    }
}());