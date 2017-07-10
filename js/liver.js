//导入3tee sdk后，定义变量，用于调用接口
var AVDEngine = ModuleBase.use(ModulesEnum.avdEngine);
var avdEngine = new AVDEngine();

//服务器uri和rest接口uri，此处使用的是3tee的测试服务器地址
//服务器地址的两种写入方式，写死或者从demo.3tee.cn/demo中获取
var serverURI = null;
var restURI = serverURI;
var accessKey = null;
var secretKey = null;
//var serverURI = "nice2meet.cn";//可以写死服务器地址
//var accessKey = "demo_access";//可以写死key
//var secretKey = "demo_secret";

function demoGetServerUrl(){//可以通过demo.3tee.cn/demo获取
	var deferred = when.defer();
	var demoUrl = protocolStr + "//demo.3tee.cn/demo/avd_get_params?apptype=live&callback=?";
	$.ajax({
		type: "get",
		url: demoUrl,
		dataType: "jsonp",
		timeout: 5000,
		success: function(data) {
			deferred.resolve(data);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			log.info("ajax (avd/api/admin/getAccessToken) errorCode:" + XMLHttpRequest.status + ",errorMsg:" + XMLHttpRequest.statusText);
			var error = {};
			error.code = XMLHttpRequest.status;
			error.message = XMLHttpRequest.statusText;
			deferred.reject(error);
		}
	});
	return deferred.promise;
}

demoGetServerUrl().then(function(data) {
	showLog("获取demo服务器地址成功");
	serverURI = data.server_uri;
	restURI = serverURI;
	accessKey = data.access_key;
	secretKey = data.secret_key;
	doGetAccessToken();
}).otherwise(alertError);

var accessToken = null;

//首先获取accessToken
function getAccessToken() {
	var deferred = when.defer();
	var protocolStr = document.location.protocol;
	var getUrl = "mcuServerURI=" + serverURI + "&accessKey=" + accessKey + "&secretKey=" + secretKey;
	var accessTokenUrl = protocolStr + "//" + restURI + "/avd/api/admin/getAccessToken?callback=?&" + getUrl;
	$.ajax({
		type: "get",
		url: accessTokenUrl,
		dataType: "jsonp",
		timeout: 5000,
		success: function(retObject) {
			var ret = retObject.result;
			if (ret == 0) {
				var retData = retObject.data;
				var accessToken = retData.accessToken;
				deferred.resolve(accessToken);
			} else {
				var error = {};
				error.code = ret;
				error.message = retObject.err;
				deferred.reject(error);
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			log.info("ajax (avd/api/admin/getAccessToken) errorCode:" + XMLHttpRequest.status + ",errorMsg:" + XMLHttpRequest.statusText);
			var error = {};
			error.code = XMLHttpRequest.status;
			error.message = XMLHttpRequest.statusText;
			deferred.reject(error);
		}
	});

	return deferred.promise;
};

function doGetAccessToken(){
	getAccessToken().then(function(_accessToken) {
		showLog("生成访问令牌成功");
		accessToken = _accessToken;
	}).otherwise(alertError);
}

//各个接口输入项显示,根据点击选显示接口的输入参数
var btnClickName = "";
function showCreateLive(){
	$("#createLiveParaDiv").show();
	$("#liveIdDiv").hide();
	$("#findLivesParaDiv").hide();
	$("#sureBtnDiv").show();
	btnClickName= "create";
	$("#inputHead").text("创建直播接口输入参数");
	$("#resultShow").html(syntaxHighlight(" "));
	$("#outputHead").text("JSON格式输出");
}

function showLiveId(clickName){
	$("#createLiveParaDiv").hide();
	$("#liveIdDiv").show();
	$("#findLivesParaDiv").hide();
	$("#sureBtnDiv").show();
	btnClickName = clickName;
	if(clickName == 'stop'){
		$("#inputHead").text("停止直播接口输入参数");
	} else if(clickName == 'get'){
		$("#inputHead").text("获取直播接口输入参数");
	} else if(clickName == 'delete'){
		$("#inputHead").text("删除直播接口输入参数");
	}
	$("#resultShow").html(syntaxHighlight(" "));
	$("#outputHead").text("JSON格式输出");
}

function showFindLives(){
	$("#createLiveParaDiv").hide();
	$("#liveIdDiv").hide();
	$("#findLivesParaDiv").show();
	$("#sureBtnDiv").show();
	btnClickName = "find";
	$("#inputHead").text("筛选直播接口输入参数");
	$("#resultShow").html(syntaxHighlight(" "));
	$("#outputHead").text("JSON格式输出");
}

//确认按钮，根据之前点击的选项调用各个接口
function queryEachRestApi(){
	switch(btnClickName)
	{
		case 'create':
			createLive();
			break;
		case 'stop':
			stopLive();
			break;
		case 'get':
			getLive();
			break;
		case 'delete':
			deleteLive();
			break;
		case 'find':
			findLives();
			break;
		default:
			break;
	}
}

//创建直播
function createLive() {
	var roomId = document.getElementById("roomId").value;
	var userId = document.getElementById("userId").value;
	var liveName = document.getElementById("liveName").value;
	var liveTag = document.getElementById("liveTag").value;
	var audioType = document.getElementById("audioType").value;
	var videoType = document.getElementById("videoType").value;
	
	var publishurl = document.getElementById("publishurl").value;
	var rtmpurl = document.getElementById("rtmpurl").value;
	var hlsurl = document.getElementById("hlsurl").value;
	
	var live = avdEngine.obtainLive(restURI);

	var liveInfo = {};
	liveInfo.name = liveName;
	liveInfo.tag = liveTag;
	liveInfo.roomId = roomId;
	liveInfo.userId = userId;
	liveInfo.audioType = audioType;
	liveInfo.videoType = videoType;
	liveInfo.publishurl = publishurl;
	liveInfo.rtmpurl = rtmpurl;
	liveInfo.hlsurl = hlsurl;
	
	live.createUserLive(accessToken, liveInfo).then(function(data) {
		showResult(data);
		document.getElementById("liveId").value = data.id;
	}).otherwise(alertError);
}

//停止直播
function stopLive() {
	var liveId = document.getElementById("liveId").value;
	
	var live = avdEngine.obtainLive(restURI);
	live.stopLive(accessToken, liveId).then(function(data) {
		showLog("停止直播成功！");
		showResult(data);
	}).otherwise(alertError);
}

//获取直播
function getLive() {
	var liveId = document.getElementById("liveId").value;
	
	var live = avdEngine.obtainLive(restURI);
	live.getLive(accessToken, liveId).then(function(data) {
		showLog("获取直播成功！");
		showResult(data);
	}).otherwise(alertError);
}

//删除直播
function deleteLive() {
	var liveId = document.getElementById("liveId").value;
	
	var live = avdEngine.obtainLive(restURI);
	live.deleteLive(accessToken, liveId).then(function(data) {
		showLog("删除直播成功！");
		showResult(data);
	}).otherwise(alertError);
}

//筛选直播
function findLives() {
	var begin = document.getElementById("begin").value;
	var count = document.getElementById("count").value;
	var fromTime = document.getElementById("fromTime").value;
	var endTime = document.getElementById("endTime").value;
	var filterRoomId = document.getElementById("filterRoomId").value;
	var filterUserId = document.getElementById("filterUserId").value;
	
	var filter = {};
	filter.fromTime = fromTime;
	filter.endTime = endTime;
	filter.roomId = filterRoomId;
	filter.userId = filterUserId;
	
	var filterStr = JSON.stringify(filter);
	
	var live = avdEngine.obtainLive(restURI);
	
	live.findLives(accessToken, begin, count, filterStr).then(function(data) {
		showLog("筛选直播成功！");
		showResult(data);
	}).otherwise(alertError);
}

//统一日志显示，在页面最下方显示步骤进度
function showLog(content){
	var myDate = new Date();
	var currentTime =  myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds();
	var showContent = currentTime + " " + content;
	if(content.indexOf("错误") > -1){
		showContent = "<span style='color:red'>" + showContent + "</span>";
	}
	$("#logShow").html($("#logShow").html() + showContent + "<br>");
	$("#jp-container").scrollTop( $('#jp-container')[0].scrollHeight);
}

//结果JSON显示
function showResult(data){
	$("#resultShow").html(syntaxHighlight(data));
	if(btnClickName == 'create'){
		$("#outputHead").text("创建直播接口JSON格式输出");
	} else if(btnClickName == 'stop'){
		$("#outputHead").text("停止直播接口JSON格式输出");
	} else if(btnClickName == 'get'){
		$("#outputHead").text("获取直播接口JSON格式输出");
	} else if(btnClickName == 'delete'){
		$("#outputHead").text("删除直播接口JSON格式输出");
	} else if(btnClickName == 'find'){
		$("#outputHead").text("筛选直播接口JSON格式输出");
	}
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

//统一错误处理，把错误alert出来
function alertError(error){
	showLog("错误原因：" + "error code:" + error.code + "; error message:" + error.message);
}
