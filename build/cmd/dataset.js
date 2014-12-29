define(function(require, exports, module) {
	var Util = require('./util');

	var DataSet = function(cfg){

		this.data = cfg && cfg.data || [];

		this.id = cfg && cfg.id || "_ds_"+Util.guid();

	}

	DataSet.prototype.appendData = function(data){
		this.data = this.data.concat(data)
	};

	DataSet.prototype.insertData = function(index,data){
		if(typeof index == "number"){
			this.data.splice(index,0,data);
		}
	};

	DataSet.prototype.removeData = function(index){
		if(typeof index == "number" && this.data[index]){
			this.data.splice(index,1);
		}else{
			this.data = [];
		}
	};

	DataSet.prototype.getData = function(index){
		if(typeof index == "number"){
			return this.data[index];
		}
		return this.data;
	};

	DataSet.prototype.setId = function(id){
		if(!id) return;
		this.id = id;
		return this.id;
	};

	DataSet.prototype.getId = function(){
		return this.id;
	};
	
	if(typeof module == 'object' && module.exports){
		module.exports = DataSet;
	}else{
		return DataSet;
	}
	});