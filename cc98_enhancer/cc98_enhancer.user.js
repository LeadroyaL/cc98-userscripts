// ==UserScript==
// @id             cc98_enhancer
// @name           cc98 enhancer
// @version        0.0.1
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        http://www.cc98.org/*
// @require        http://libs.baidu.com/jquery/2.0.3/jquery.min.js
// @run-at         document-end
// ==/UserScript==

(function() {


// a collection of simple browser-side JavaScript snippets
(function(definition) {
    if (typeof define === "function" && define.amd) {
        define(definition);
    } else {
        chaos = definition;
    }
})({

    /**
     * Generates a GUID string, according to RFC4122 standards.
     * @returns {String} The generated GUID.
     * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
     * @author Slavik Meltser (slavik@meltser.info).
     * @link http://slavik.meltser.info/?p=142
     */
    guid: function() {
        function _p8(s) {
            var p = (Math.random().toString(16) + "000000000").substr(2, 8);
            return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
        }
        return _p8() + _p8(true) + _p8(true) + _p8();
    },

    // parse the url get parameters
    parseQS: function(url, preserve_case) {
        if (!preserve_case) {
            url = url.toLowerCase();
        }
        url = url.split('#')[0]; // remove the hash part
        var t = url.indexOf('?');
        var hash = {};
        if (t >= 0) {
            var params = url.substring(t + 1).split('&');
        } else { // plain query string without '?' (e.g. in cookies)
            var params = url.split('&');
        }
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split('=');
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
        return hash;
    },

    toQS: function(obj) {
        var ret = [];
        for (var key in obj) {
            if ('' === key) continue;
            if ('' === obj[key]) continue;
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
        return ret.join('&');
    },

    parseURL: function(url) {
        // from JavaScript: The Good Parts
        var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/
        var arr = parse_url.exec(url);
        var result = {};
        result['url'] = arr[0];
        result['scheme'] = arr[1];
        result['slash'] = arr[2];
        result['host'] = arr[3];
        result['port'] = arr[4];
        result['path'] = arr[5];
        result['query'] = arr[6];
        result['hash'] = arr[7];
        return result;
    },

    parseCookies: function() {
        var cookies = {}; // The object we will return
        var all = document.cookie; // Get all cookies in one big string
        if (all === '') // If the property is the empty string
            return cookies; // return an empty object
        var list = all.split('; '); // Split into individual name=value pairs
        for (var i = 0; i < list.length; i++) { // For each cookie
            var cookie = list[i];
            var p = cookie.indexOf('='); // Find the first = sign
            var name = cookie.substring(0, p); // Get cookie name
            var value = cookie.substring(p + 1); // Get cookie value
            value = decodeURIComponent(value); // Decode the value
            cookies[name] = value; // Store name and value in object
        }
        return cookies;
    },

    getCookie: function(name) {
        return chaos.parseCookies()[name];
    },

    getSubCookie: function(name, sub) {
        return chaos.parseQS(chaos.getCookie(name), true)[sub];
    },

    setCookie: function(name, val, options) {
        options = options || {};

        var expires = options.expires;
        var path = options.path;
        var domain = options.domain;

        var text = encodeURIComponent(name) + '=' + val;
        if (expires instanceof Date) {
            text += '; expires=' + expires.toGMTString();
        }
        text += '; path=' + path;
        if (domain) {
            text += '; domain=' + domain;
        }
        document.cookie = text;
    },

    setSubCookie: function(name, sub, val, options) {
        var hash = chaos.parseQS(chaos.getCookie(name), true);
        hash[sub] = val;
        chaos.setCookie(name, chaos.toQS(hash), options);
    },

    // 将部分常见的转义后的html转回来
    unescapeHTML: function(input) {
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
    },

    // deprecated
    // 建议用 q-http 模块的 ajax 函数，该函数返回一个 promise，更方便异步编程 
    ajax: function(opts) {
        opts = {
            type: opts.type || 'GET',
            url: opts.url || '',
            data: opts.data || null,
            contentType: opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
            success: opts.success || function() {},
            async: opts.async || (opts.async === undefined)
        };

        // Chrome 没有sendAsBinary函数，这里是一个实现
        if (!XMLHttpRequest.prototype.sendAsBinary) {
            XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
                function byteValue(x) {
                    return x.charCodeAt(0) & 0xff;
                }
                var ords = Array.prototype.map.call(datastr, byteValue);
                var ui8a = new Uint8Array(ords);
                this.send(ui8a);
            };
        }


        var xhr = new XMLHttpRequest();
        if (opts.type === 'GET') {
            opts.url += opts.data ? ('?' + chaos.toQS(opts.data)) : '';
        }
        xhr.open(opts.type, opts.url, opts.async);
        if (opts.contentType) {
            xhr.setRequestHeader('Content-type', opts.contentType);
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                opts.success(xhr.responseText);
            }
        };

        // GET Request
        if (opts.type === 'GET') {
            xhr.send();
            return;
        }

        // POST Request
        if (opts.contentType === 'application/x-www-form-urlencoded; charset=UTF-8') {
            xhr.send(chaos.toQS(opts.data));
        } else {
            xhr.sendAsBinary(opts.data)
        }
    },

    get: function(url, data, calllback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajax({
            type: 'GET',
            url: url,
            data: data,
            success: callback
        });
    },

    post: function(url, data, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajax({
            type: 'POST',
            url: url,
            data: data,
            success: callback
        });
    },

    // @param {string} url sth like 'http://example.com/service?callback={callback}', which is the same as YUI's jsonp function
    jsonp: function(url, callback) {
        var proxy = function() {
            callback.aplly(this, arguments);
        };
        var prefix = '_CHAOS_JSONP_'
        var name = prefix + chaos.guid().replace(/-/g, '_'); // generate a unique valid function name
        global = unsafeWindow || window; // for compatibility with GM scripts
        global[name] = proxy;

        var script = document.createElement('script');
        var url = url.replace('{callback}', name);

        script.src = url;
        script.onload = function() {
            document.removeChild(script);
        };

        document.body.appendChild(script);
    },

    // xpath query
    //@return {Array}   返回由符合条件的DOMElement组成的数组
    xpath: function(expr, contextNode) {
        contextNode = contextNode || document;
        var xresult = document.evaluate(expr, contextNode, null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var xnodes = [];
        var xres;
        while (xres = xresult.iterateNext()) {
            xnodes.push(xres);
        }

        return xnodes;
    },

    // 添加CSS
    addStyles: function(css) {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        style.setAttribute('type', 'text/css');
        style.innerHTML = css;
        head.appendChild(style);
    },

    // 计算字符串字节数
    // from http://imatlas.com/posts/js-count-string-bytes/
    sizeof: function(str, charset) {
        charset = charset || 'utf-8';
        charset = charset.toLowerCase();

        var total = 0;

        if (charset === 'utf-16' || charset === 'utf16') {
            for (var i = 0; i != str.length; ++i) {
                if (str.charCodeAt(i) <= 0xffff) {
                    total += 2;
                } else {
                    total += 4;
                }
            }
        } else {
            for (var i = 0; i != str.length; ++i) {
                var code = str.charCodeAt(i)
                if (code <= 0x007f) {
                    total += 1;
                } else if (code <= 0x07ff) {
                    total += 2;
                } else if (code <= 0xffff) {
                    total += 3;
                } else {
                    total += 4;
                }
            }
        }
        return total;
    }
});


// simple helper functions to help write modular JavaScript
// from: http://leechan.me/?p=1241
// modified by soda<sodazju@gmail.com>
(function(global) {
    var modules = {}, cached = {};

    // @usage: define('id', function(exports, module) {});
    global.define = function(id, func) {
        modules[id] = {};
        if (func instanceof Function) {
            modules[id].factory = func;
        } else {
            modules[id].exports = func;
        }
    };

    // @usage: var a = require('id');
    global.require = function(id) {
        if (cached[id]) {
            return cached[id];
        } else {
            return cached[id] = (modules[id].exports || modules[id].factory(modules[id].exports = {}, modules[id]) || modules[id].exports);
        }
    };
})(this);


// 本项目中用了自定义的 define 和 require 函数
// 而 chaos.js 本身并不是模块化的
// jQuery 仅支持 AMD 规范的模块加载
// 故为了保持接口的一致性增加了这两句（考虑到这些库都已经放到了全局命名空间，所以这真的仅仅是为了看上去模块化一点）

_chaos = chaos;
define('chaos', _chaos);

// 因为 jQuery 对象是一个函数，直接作为参数传入的话会导致它被当作一个 factory 函数运行，所以只能 return
define('jQuery', function(exports, module) {
    return jQuery.noConflict();
});


define('CC98URLMap', function(exports, module) {
    // 默认文件上传到的版面：论坛帮助
    // 允许 gif|docx|xlsx|pptx|pdf|xap|jpg|jpeg|png|bmp|rar|txt|zip|mid|rm|doc|mp3
    var DEFAULT_UPLOAD_BOARDID = 184;

    // 其他文件扩展名与允许上传的boardid的对应列表
    var file2boardid = {
        'ipa': 598, // iOS
        'ppt': 598,
        'xls': 598,
        'chm': 598,
        'wma': 169, // 摇滚和独立音乐
        'lrc': 169,
        'asf': 169,
        'flv': 169,
        'wmv': 169,
        'rmvb': 169,
        'mpg': 169,
        'avi': 169,
        'swf': 170, // 史海拾贝
        'rep': 200, // 星际专区
        'tar': 212, // Linux天地
        'gz': 212,
        'bz2': 212,
        'tbz': 212,
        'tgz': 212,
        'psd': 239, // 贴图工坊
        'gtp': 308, // 乱弹吉他
        'gp3': 308,
        'gp4': 308,
        'gp5': 308,
        'torrent': 499, // 多媒体技术
        'srt': 499
    };

    var baseURL = 'http://www.cc98.org/';

    var that = {};

    // 发米
    that.famiURL = function() {
        return 'http://www.cc98.org/master_users.asp?action=award';
    }

    // 上传
    that.uploadURL = function(filename) {
        var ext = file.name.substring(file.name.lastIndexOf('.') + 1);
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        return 'http://www.cc98.org/saveannouce_upfile.asp?boardid=' + boardid;
    }

    // postURL 发新帖

    // 回复
    that.replyURL = function(boardid) {
        return 'http://www.cc98.org/SaveReAnnounce.asp?method=Topic&boardid=' + boardid;
    }

    // 编辑
    that.editURL = function(boardid, id, replyid) {
        return 'http://www.cc98.org/SaveditAnnounce.asp?boardid=' + boardid + '&id=' + id + '&replyid=' + replyid;
    }

    // 站短
    that.pmURL = function() {
        return 'http://www.cc98.org/messanger.asp?action=send';
    }

    // 登录
    that.loginURL = function() {
        return 'http://www.cc98.org/login.asp';
    }

    module.exports = that;

});


define('libcc98', function(exports, module) {
    var chaos = require('chaos');
    var $ = require('jQuery');
    var CC98URLMap = require('CC98URLMap');

    var log = function() {
        console.log.apply(console, arguments);
    }

    // 从 cookie 中获取有效信息
    var user_info = (function() {
        var that = {};

        that.is_simple = (chaos.getCookie('cc98Simple') === '1');
        that.username = chaos.getSubCookie('aspsky', 'username');
        that.password = chaos.getSubCookie('aspsky', 'password');

        return that;
    })();

    var parseTopicList = function(html) {
        var doc;
        var topicsDOM;
        var topics = [];

        if (!html) {
            doc = document;
        } else {
            doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = html;
        }

        topicsDOM = $(doc).find('tr[style="vertical-align: middle;"]');

        topics = topicsDOM.filter(function(index) {
            // 对简版的修正
            if (user_info.is_simple && index === 0) {
                return false;
            } else {
                return true;
            }
        }).map(function(index, ele) {
            var topic = {};

            var tr = $(ele);

            topic.DOM = ele;
            topic.type = user_info.is_simple ? tr.children().first().text().trim() : tr.children().children().first().attr('title');
            topic.href = tr.children().eq(1).children('a').attr('href');
            topic.title = tr.children().eq(1).children('a').children().eq(0).text();
            topic.author = tr.children().eq(2).children().eq(0).text() || '匿名';
            topic.lastReplyTime = tr.children().eq(4).children().eq(0).text();
            topic.lastReplyUser = JSON.parse(tr.next().text().replace(/.*'{(.*)}'.*/g, '{$1}'))['usr'];

            return topic;
        }).toArray();

        return topics;
    };

    var parsePostList = function(html) {
        var doc;
        var postsDOM;
        var posts = [];

        if (!html) {
            doc = document;
        } else {
            doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = html;
        }

        // 98自己的 anchors 也是跳过被删除发言的，所以这里就不考虑了
        var anchors = $(doc).find('a[name]').filter(function(index) {
            return /^\d{1,2}$/g.test(this.name);
        });

        // 简版
        if (user_info.is_simple) {
            posts = anchors.map(function(index, ele) {
                var post = {};

                var table = $(ele).next();

                post.anchor = parseInt(ele.name, 10);
                post.DOM = table.get(0); // 整个回复的 DOM，在屏蔽时有用

                post.authorDOM = table.find('.usernamedisp').find('span, b').get(0); // 心灵是 span，普通帖子是 b 套着个 a
                post.author = post.authorDOM.textContent;
                post.time = post.authorDOM.parentNode.textContent.replace(/.*发表于(.*(AM|PM)).*/g, '$1').trim();
                post.quote_btn = $(post.authorDOM).next().next().get(0);
                post.annouceid = chaos.parseQS(post.quote_btn.href)['replyid']; // 通过「引用」按钮的链接提取
                post.storey = post.authorDOM.parentNode.textContent.replace(/^(.*)该贴由.*/g, '$1').trim();; // 每层楼边上服务器给出的楼层数

                // 以下可能没有（楼主可见/指定用户可见/回复可见）
                post.expression = table.find('.usernamedisp').next().attr('src'); // 小表情
                post.title = table.find('.usernamedisp').next().next().text(); // 标题
                post.content = table.find('.usernamedisp').next().next().next().next().text(); // 回复内容

                return post;
            }).toArray();

            return posts;
        }

        // 完整版
        posts = anchors.map(function(index, ele) {
            var post = {};

            var table = $(ele).next();

            post.anchor = parseInt(ele.name, 10);
            post.DOM = table.get(0); // 整个回复的 DOM，在屏蔽时有用

            post.authorDOM = table.children().children().children().eq(0).find('span').get(0);
            post.author = $(post.authorDOM).children().eq(0).text();
            post.time = table.children().children().eq(1).children().eq(0).text().trim();
            post.quote_btn = table.find('img[src="pic/reply.gif"]').parent().get(0); // 暴露接口方便修改 UI
            post.annouceid = chaos.parseQS(post.quote_btn.href)['replyid']; // 通过「引用」按钮的链接提取
            post.storey = post.quote_btn.parentNode.textContent.trim(); // 每层楼边上服务器给出的楼层文字

            // 以下可能没有（楼主可见/指定用户可见/回复可见）
            var user_post = table.find('blockquote script').parent().eq(0);

            post.expression = user_post.find('img[title="发贴心情"]').attr('src'); // 小表情
            post.title = user_post.children().eq(1).text(); // 标题
            post.content = user_post.children().eq(3).text(); // 回复内容

            return post;
        }).toArray();

        return posts;
    };

    var getTopicList = function(url, callback) {
        var deferred, promise;

        if (callback instanceof Function) {
            getTopicList(url).then(callback);
        }

        if (url && chaos.parseURL(url)['path'] !== 'list.asp') {
            return;
        }

        // 不带任何参数表示同步调用，返回当前页的帖子列表
        if (!url) {
            return parseTopicList();
        } else { // 不然的话异步获取页面源码再解析（考虑到多重引用什么的也需要重新请求页面，故不必判断网址以节省一次请求）
            promise = $.get(url).then(parseTopicList);
        }

        return promise;
    };

    var getPostList = function(url, callback) {
        var deferred, promise;

        if (callback instanceof Function) {
            getPostList(url).then(callback);
        }

        if (url && chaos.parseURL(url)['path'] !== 'dispbbs.asp') {
            return;
        }

        // 不带任何参数表示同步调用，返回当前页的回复列表
        if (!url) {
            return parsePostList();
        } else {
            promise = $.get(url).then(parsePostList);
        }

        return promise;
    };

    var test = function() {
        /*
        // 普通版面
        getTopicList('http://www.cc98.org/list.asp?boardid=81').then(function(topics) {
            log('情感空气第 10 个帖子（包括置顶）');
            log(topics[9]);
        });
        // 心灵
        getTopicList('http://www.cc98.org/list.asp?boardid=182').then(function(topics) {
            log('心灵之约置顶帖首位');
            log(topics[0]); //置顶帖
            log('心灵之约第 10 个帖子（包括置顶）');
            log(topics[9]); // 心灵普通帖子
        });

        // 被锁定版面
        getTopicList('http://www.cc98.org/list.asp?boardid=537').then(function(topics) {
            log('暑假版第 10 个帖子（包括置顶）');
            log(topics[9]);
        });

        // 普通帖子
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=186&id=4108287').then(function(posts) {
            log('测试普通帖子');
            log(posts[0]);
        });

        // 蓝名用户
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=357&ID=3469578').then(function(posts) {
            log('测试蓝名用户');
            log(posts[0]);
        });

        // 红名用户
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=4292487').then(function(posts) {
            log('测试红名用户');
            log(posts[0]);
        });

        // 被锁定帖子
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=17&ID=4292545').then(function(posts) {
            log('测试被锁定帖子');
            log(posts[1]);
        });

        // 心灵帖子
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=182&ID=4238943').then(function(posts) {
            log('测试心灵帖子');
            log(posts[1]);
        });

        //////////////////////////////////////////////////////////////////////////
        // 以上均已测试通过
        //////////////////////////////////////////////////////////////////////////

        */
        /*
        // 回复可见（不可见）
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=182&ID=3652234').then(function(posts) {
            log('回复可见帖子首楼');
            log(posts[0]); // 1 楼，在回复可见出现前
            log('回复可见的帖子回复');
            log(posts[1]); // 2 楼，回复可见且对当前用户不可见
            log('回复可见帖子的后一楼');
            log(posts[2]); // 3 楼，在回复可见后的一层，用以检查楼层是否乱掉
        });

        // 回复可见（可见）
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=3705020').then(function(posts) {
            log('回复可见帖子中的可见帖');
            log(posts[1]);
        });
        
        // 被删除帖子
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4133896').then(function(posts) {
            log('测试被删除帖子');
            log('被删除的楼');
            log(posts[6]);
            log('被删除的后一楼');
            log(posts[7]);
        });

        // 楼主可见
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=2805301').then(function(posts) {
            log('测试楼主可见');
            log('可见帖');
            log(posts[0]);
            log('不可见帖');
            log(posts[1]);
        });

        // 指定用户可见（当前用户不可见）
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4133896&star=597').then(function(posts) {
            log('测试指定用户可见（当前用户不可见）');
            log(posts[0]);
        });

        // 指定用户可见（当前用户可见）
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4014074&star=288').then(function(posts) {
            log('测试指定用户可见（当前用户可见）');
            log(posts[9]);
        });

        // 投票
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=4285186').then(function(posts) {
            log('测试投票帖');
            log(posts[0])
        });

        // 被屏蔽的用户
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=622&ID=3720912').then(function(posts) {
            log('测试被屏蔽用户');
            log(posts[0]);
        });

        // 该用户不存在
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=357&ID=3469578').then(function(posts) {
            log('测试已不存在的用户');
            log(posts[0]);
        });

        // 心灵匿名/不匿名混合贴
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=182&id=153389&star=9').then(function(posts) {
            log('测试心灵匿名/不匿名混合贴');
            log(posts[0]);
            log(posts[1]);
            log(posts[3]);
        });

        // 追踪页面（由于链接有时效性，故暂略）
        // getPostList('').then(function(posts) {});
*/
    };


    var libcc98 = {};

    libcc98.user_info = user_info;
    libcc98.getTopicList = getTopicList;
    libcc98.getPostList = getPostList;

    libcc98.test = test;

    return libcc98;
});


define('options', function(exports, module) {
    // 用户实际存下来的 options 数据
    var options = {};
    // 默认选项
    var DEFAULT_OPTIONS = {
        "ignored_users": {
            "description": "屏蔽用户名单",
            "value": []
        }
    };

    var save = function() {
        localStorage.setItem('enhancer_options', JSON.stringify(options));
    }

    var restore = function() {
        options = JSON.parse(localStorage.getItem('enhancer_options')) || {};

        // 如果新增了默认配置项，则加入到原配置中
        for (var prop in DEFAULT_OPTIONS) {
            if (options[prop] === undefined) {
                options[prop] = DEFAULT_OPTIONS[prop];
            }
        }

        // 屏蔽名单字段名从 blocked_users 改成了 ignored_users
        // 为了保持兼容……（虽然上一个版本可能只有丁丁姐在用）
        if (options['blocked_users']) {
            options['ignored_users'] = options['ignored_users'];
            delete options['blocked_users'];
        }
        save();
    }

    var get = function(key) {
        return options[key].value;
    }

    var set = function(key, value) {
        options[key].value = value;
        save();
    }

    var remove = function(key) {
        delete options[key].value;
        save();
    }

    // 覆盖整个页面的遮罩层、绝对定位的选项卡（50%~80% width）
    // 点确认/取消隐藏界面
    var addButton = function() {
        console.log('options.addButton');
        var $ = require('jQuery');
        var chaos = require('chaos');

        // 先生成对应 DOM 结构，然后在鼠标点击时显示/隐藏该 div
        var div = $('<div id="enhancer-options"></div>');
        var dl = $('<dl></dl>');

        for (var key in options) {
            var dt = $('<dt>' + options[key]['description'] + '</dt>');
            dt.data('key', key);

            var dd = $('<dd></dd>');
            // 如果是数组，则依次展现数组元素
            if (Array.isArray(get(key))) {
                for (var i = 0; i !== get(key).length; ++i) {
                    var item = $('<span class="array-item">' + get(key)[i] + '<a class="delete-item"></a></span>');
                    dd.append(item);
                }
                dd.append('<input type="text" class="new-item">').append('<a class="add-item"></a>');
            }
            dl.append(dt).append(dd);
            div.append(dl);
        }
        div.append('<div><button class="enhancer-btn" id="submit-options">确定</button></div>');
        $('body').append(div);

        div.hide();

        div.on('click', '.delete-item', function(e) {
            var item = $(this).parent();
            var key = item.parent().prev().data('key');
            var array = get(key);
            var value = item.text();

            array.splice(array.indexOf(value), 1);
            set(key, array);

            item.remove();
        });
        $('.add-item').click(function(e) {
            var item = $(this).prev()
            var value = item.prop('value').trim();
            if (!value) {
                return;
            }

            var dd = item.parent();
            var key = dd.prev().data('key');
            var array = get(key);

            if (array.indexOf(value) !== -1) {
                return;
            }
            array.push(value);
            set(key, array);

            item.prop('value', '');
            item.before('<span class="array-item">' + value + '<a class="delete-item"></a></span>');
        });
        $('.new-item').keyup(function(e) {
            if (e.keyCode === 13) {
                $(this).next().click();
            }
        });

        $('#submit-options').click(function(e) {
            div.hide();
        });

        // 添加按钮
        $('<a id="show-enhancer-options" href="javascript:;">enhancer选项</a>')
            .appendTo($('.TopLighNav1').children().children().eq(0))
            .before('<img align="absmiddle" src="pic/navspacer.gif"> ')
            .on('click', function() {
                div.show();
            });

        chaos.addStyles([
            '#enhancer-options {',
            '    position: absolute;',
            '    top: 150px;',
            '    left: 15%;',
            '    width: 70%;',
            '    margin: 0 auto;',
            '    border: 1px solid #ccc;',
            '    border-radius: 5px;',
            '    box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);',
            '    padding: 20px;',
            '    background-color: #fff;',
            '}',
            '#enhancer-options dl { margin: 0; }',
            '#enhancer-options dt, #enhancer-options dd {',
            '    display: inline-block;',
            '    padding-top: 0;',
            '    color: #333;',
            '    font-size: 14px;',
            '}',
            '.array-item {',
            '    border: 0 none;',
            '    border-radius: 3px;',
            '    background-color: #ddd;',
            '    box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25);',
            '    padding: 0 5px;',
            '    display: inline-block;',
            '    margin-left: 30px;',
            '}',
            '.add-item, .delete-item {',
            '    display: inline-block;',
            '    vertical-align: middle;',
            '    width: 16px;',
            '    height: 16px;',
            '    cursor: pointer;',
            '}',
            '.delete-item {',
            '    margin-left: 4px;',
            '    background-image: url(http://file.cc98.org/uploadfile/2013/12/2/2101869387.png);',
            '}',
            '.add-item {',
            '    margin-left: 30px;',
            '    background-image: url(http://file.cc98.org/uploadfile/2013/12/2/2101873264.png);',
            '}',
            '.new-item {',
            '    margin-left: 30px;',
            '    width: 80px;',
            '}',
        ].join('\n'));
    }

    init = function() {
        restore();
    }

    init();
    var that = {};
    that.save = save;
    that.restore = restore;
    that.get = get;
    that.set = set;
    that.remove = remove;
    that.addButton = addButton;
    that.init = init;
    module.exports = that;
});


define('utils', function(exports, module) {
    var utils = {};

    var chaos = require('chaos');
    var libcc98 = require('libcc98');
    var options = require('options');
    var $ = require('jQuery');

    var ignored_users = options.get('ignored_users');

    // @param {string} type 'posts'|'topics' 表示屏蔽页面还是屏蔽
    utils.ignore = function(type) {
        var list;

        if (type === 'posts') {
            list = libcc98.getPostList();
        } else if (type === 'topics') {
            list = libcc98.getTopicList();
        } else {
            return;
        }

        list.forEach(function(item) {
            if (ignored_users.indexOf(item.author) === -1) {
                return;
            }

            var ignored = $(item.DOM);
            var width = item.DOM.clientWidth;

            // 隐藏 DOM 节点
            ignored.find('a, span, font, td').css('color', '#999');
            ignored.addClass('ignored');
            ignored.hide();

            // 增加恢复功能
            var collapsed = $((type === 'topics') ? '<tr class="collapsed-item"><td colspan="5"></td></tr>' :
                '<div class="collapsed-item"></div>');
            var switcher = $('<a class="collapsed-switcher" href="javascript:;">该帖已被屏蔽，点击展开</a>')

            switcher.click(function() {
                ignored.toggle();
                switcher.text(switcher.text() === '该帖已被屏蔽，点击展开' ? '帖子已展开，点击屏蔽' : '该帖已被屏蔽，点击展开');
            });

            chaos.addStyles([
                '.ignored a, .ignored span, .ignored font, .ignored td { color: #999 !important; }',

                '.collapsed-item td { padding: 0; }',
                'div.collapsed-item {',
                '   width: 97%;',
                '   margin: auto;',
                '   border: 0;',
                '}',

                '.collapsed-switcher {',
                '   display: block;',
                '   font-size: 12px;',
                '   text-align: center;',
                '   background-color: #eee;',
                '   color: #999 !important;',
                '}',
                '.collapsed-switcher:hover {',
                '   background-color: #ddd;',
                '   color: #333 !important;',
                '   text-decoration: none;',
                '}',

            ].join('\n'));

            (type === 'topics' ? collapsed.children() : collapsed).append(switcher);

            ignored.before(collapsed);
        });
    };

    module.exports = utils;
});


// @require chaos.js
// @require libcc98.js
// @require jquery

define('alias', function(exports, module) {
    // 显示备注管理界面
    function showAliasesManager() {}
});





// 在原生回复框下方加入表情菜单（可自定义）


define('app', function(exports, module) {
    var app = {};

    var chaos = require('chaos');
    var options = require('options');
    var libcc98 = require('libcc98');
    var utils = require('utils');

    var isTopicList = (location.pathname === '/list.asp');
    var isPostList = (location.pathname === '/dispbbs.asp');
    var isXinlin = (chaos.parseQS(location.search)['boardid'] === '182');

    app.route = function(cond, func) {
        if (cond) {
            func();
        }
    };

    app.init = function() {
        app.route(true, options.addButton); // 给每个界面加上选项菜单
        app.route(true, libcc98.test); // 测试 libcc98 组件
        app.route(isTopicList, function() {
            utils.ignore('topics');
        }); // 屏蔽主题帖
        app.route(isPostList, function() {
            utils.ignore('posts');
        }); // 屏蔽回复内容
    };

    module.exports = app;
});

var app = require('app');
app.init();


})();
