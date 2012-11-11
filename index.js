var FSI = require("fsi"),
    MirrorStream = require("mirrorstream"),
    DelayedStream = require("delayedstream");

var FSIVFS = module.exports = function(wrapped){
	this.vfs = wrapped;
	FSI.call(this);
};

require("util").inherits(FSIVFS, FSI);

FSIVFS.prototype.createReadStream = function(path, options){
	var stream = new MirrorStream();

	this.vfs.readfile(path, options, function(err, meta){
		if(err) stream.emit("error", err);
		else meta.stream.pipe(stream);
	});

	return stream;
};

FSIVFS.prototype.createWriteStream = function(path, options){
	var stream = new DelayedStream();

	this.vfs.mkfile(path, options, function(err, meta){
		if(err) stream.emit("error");
		else stream.pipe(meta.stream);
	});

	return stream;
};

FSIVFS.prototype.readDir = function(path, options, cb){
	if(typeof options === "function"){
		cb = options;
		options = null;
	}
	this.vfs.readdir(path, options, function(err, meta){
		if(err) return cb(err);

		var files = [];
		meta.stream.on("data", function(o){
			files.push(o.name);
		});
		meta.stream.on("end", function(){
			if(cb) cb(null, files);
		});
		meta.stream.on("error", function(e){
			if(cb) cb(e);
			cb = null;
		});
	});
};

module.exports = FSIVFS;