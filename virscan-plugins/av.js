layui.use(['upload', 'element', 'layer', 'table'], function(){
  var $ = layui.jquery;
  var upload = layui.upload;
  var element = layui.element;
  var layer = layui.layer;
  var table = layui.table;
  var uf_data = {"name": "", "size": "", "type": ""};
  var T = ""; // 定时器

  function timeconvert(time) {
    var date = new Date(time * 1000); 
    return date.toJSON().substr(0, 19).replace('T', ' ');
  }

  function sizeconvert(fileSize) {
      if (fileSize < 1024) {
          return fileSize + 'B';
      } else if (fileSize < (1024*1024)) {
          var temp = fileSize / 1024;
          temp = temp.toFixed(2);
          return temp + 'KB';
      } else if (fileSize < (1024*1024*1024)) {
          var temp = fileSize / (1024*1024);
          temp = temp.toFixed(2);
          return temp + 'MB';
      } else {
          var temp = fileSize / (1024*1024*1024);
          temp = temp.toFixed(2);
          return temp + 'GB';
      }
  }

  function show_result(sha256){

    $('#f_name').text(uf_data.name);
    $('#f_type').text(uf_data.type);
    $('#f_size').text(sizeconvert(uf_data.size));
    $('#av_sha256').text(sha256);
    $('#av-result').show();

    $.ajax({
      type: 'GET',
      url: 'http://www.virscan.org/v1/file/sha256/search/' + sha256 + '?page=detail',
      dataType: 'JSON',
      success: function(res){
        if (res.code == 0 ){
          resp = res.data;
          // 全部检查完毕
          if (resp.status == 1){
            if ( resp.positives == 0 ) {
              $('#av_img').attr('src', 'img/safe.png');
              $('#av_num').attr("class", 'layui-badge layui-bg-green');
              $('#av_num').text('有0引擎检出');
              $('#av_last').text(timeconvert(resp.meta.lst));
            } else {
              $('#av_img').attr('src', 'img/warn.png');
              $('#av_num').attr("class", 'layui-badge');
              $('#av_num').text('有'+ resp.positives +'引擎检出');
              $('#av_last').text(timeconvert(resp.meta.lst));
            }

            clearInterval(T);
            load_table(resp.me);
          } else {
            if ( resp.positives == 0 ) {
              $('#av_img').attr('src', 'img/safe.png');
              $('#av_num').attr("class", 'layui-badge layui-bg-green');
              $('#av_num').text('有0引擎检出');
              $('#av_type').text("无");
              $('#av_family').text("无");
              $('#av_last').text(timeconvert(resp.meta.lst));
            } else {
              $('#av_img').attr('src', 'img/warn.png');
              $('#av_num').attr("class", 'layui-badge');
              $('#av_num').text('有'+ resp.positives +'引擎检出');
              $('#av_last').text(timeconvert(resp.meta.lst));
            }

            load_table(resp.me);
          }
        } else {
          console.log('请求异常: ' + res.verbose_msg)
        }
      },
      error: function(res){
        console.log('请求错误: ' + res)
      }
    });
  };

  function load_table(data){
    var _d = data;
    var t_data = []
    var _t = {}
    layer.load();
    _d.forEach(function(_i, index) {
      if (index % 2 == 1 ){
        _t = Object.assign(_t, {
          'engine1': _i.engine, 'result1': _i.result, 
          'category1': _i.category, 
        });
        t_data.push(_t)
      } else {
        _t = _i;
      }
    });

    var t1 = table.render({
      elem: '#av-table',
      data: t_data,
      limit: 30,
      cols: [[
        {field: 'engine', title: '引擎', width: '15%'},
        {field: 'result', title: '结果', width: '35%',templet: function(d){
          if (d.category == "undetected"){
            return '<i class="layui-icon" style="color:#00b463;">&#x1005;<span style="color: #00b463;">无检出</span></i>'
          } else if (d.category == "suspected"){
            return '<i class="layui-icon" style="color: #fedc5e">&#xe607;<span style="color: #fedc5e;">'+d.result+'</span></i>'
          } else if (d.category == "not found"){
            return '<i class="layui-icon" style="color:#00b463;">&#x1005;<span style="color: #00b463;">无检出</span></i>'
          }else if (d.category == "detected"){
            return '<i class="layui-icon" style="color:#c12c1f">&#xe60b;<span style="color: #c12c1f;">'+d.result+'</span></i>'
          }
        }},
        {field: 'engine1', title: '引擎', width: '15%'},
        {field: 'result1', title: '结果', width: '35%',templet: function(d){
          if (d.category1 == "undetected"){
            return '<i class="layui-icon" style="color:#00b463;">&#x1005;<span style="color: #00b463;">无检出</span></i>'
          } else if (d.category1 == "suspected"){
            return '<i class="layui-icon" style="color: #fedc5e">&#xe607;<span style="color: #fedc5e;">'+d.result1+'</span></i>'
          } else if (d.category1 == "not found"){
            return '<i class="layui-icon" style="color:#00b463;">&#x1005;<span style="color: #00b463;">无检出</span></i>'
          } else if (d.category1 == "detected") {
            return '<i class="layui-icon" style="color:#c12c1f">&#xe60b;<span style="color: #c12c1f;">'+d.result1+'</span></i>'
          }
        }},
      ]],
    });
    layer.closeAll('loading');
  }

  var xhrOnProgress = function (fun) {
      xhrOnProgress.onprogress = fun; //绑定监听
      //使用闭包实现监听绑
      return function () {
          //通过$.ajaxSettings.xhr();获得XMLHttpRequest对象
          var xhr = $.ajaxSettings.xhr();
          //判断监听函数是否为函数
          if (typeof xhrOnProgress.onprogress !== 'function')
              return xhr;
          //如果有监听函数并且xhr对象支持绑定时就把监听函数绑定上去
          if (xhrOnProgress.onprogress && xhr.upload) {
              xhr.upload.onprogress = xhrOnProgress.onprogress;
          }
          return xhr;
      }
  }

  //拖拽上传
  upload.render({
    elem: '#av-drag',
    url: 'http://www.virscan.org/v1/file/sha256/upload',
    size: 51200,
    accept: 'file',
    before:function(f){
      fs = f.pushFile();
      for (var i in fs ){
        uf_data.name = fs[i].name;
        uf_data.size = fs[i].size;
        uf_data.type = fs[i].type;
      };
      this.url += '?size=' + uf_data.size + '&filename=' + uf_data.name;
      // 弹出进度条
      layer.open({
        type: 1,
        title: '正在上传,请稍后...',
        shade: 0.5,
        area: ['300px', '100px'],
        content: $('#progress-show'),
        closeBtn: 0,
//        cancel: function(d){
//          if (confirm('确定取消上传?')) {
//            history.go(0);
//            layer.close(layer.index);
//          }
//          return false;
//        },
      });
    },
    progress:function(n, elem, res, index){
      var percent = n + '%' //获取进度百分比
      console.log(percent);
      element.progress('demo', n + '%');
    },
    done: function(res){
      if ( res.code == 0 ){
        layer.close(layer.index);
        $('#av-drag').hide();
        show_result(res.data.sha256);
        T = setInterval(show_result, 3000, res.data.sha256);
      } else {
        layer.msg(res.msg, {icon: 5});
      }
    }
  });
});
