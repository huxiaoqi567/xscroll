define(function(require, exports, module) {

	var DataSet = function(cfg){

		this.data = cfg && cfg.data || [];

		this.id = cfg && cfg.id || "_ds_"+Date.now();

	}

	DataSet.prototype.appendData = function(data){
		this.data = this.data.concat(data)
	};

	DataSet.prototype.removeData = function(){
		this.data = [];
	};

	DataSet.prototype.getData = function(){
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


	return DataSet;

})