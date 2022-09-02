var imgconver = {};
layui.use(['upload', 'element', 'layer', 'table'], function(){
  var $ = layui.jquery;
  var upload = layui.upload;
  var element = layui.element;
  var layer = layui.layer;
  var table = layui.table;
  var T = "";

  function timeconvert(time) {
    var date = new Date(time); 
    return date.toJSON().substr(0, 19).replace('T', ' ');
  }

  var clipboard = new ClipboardJS('#copy_btn')
  
  clipboard.on('success', function (e) {
    e.clearSelection()
  })
  
  document.addEventListener('copy', function (event) {
    layer.msg('复制成功');
  })

  function gen_account(){
    var acct = localStorage.getItem('acct');
    if (!acct){
      random_acct = 'anonymous' + Math.random().toString(36).slice(-6) + '@snapmail.cc'
      localStorage.setItem('acct', random_acct);
      acct = random_acct;
    }
    $('#tempmail').text(acct);
    return acct;
  }


  function read_db(){
    var db = localStorage.getItem('read_db');

    if (!db){
      localStorage.setItem('read_db', '{}');
    }
    _ = JSON.parse(localStorage.getItem('read_db'));

    return _

  }

  function is_read(id){
    _ = read_db();
    if (_.hasOwnProperty(id)){
      return true
    } else {
      return false
    }
  }

  function set_read(id){
    _ = read_db();
    _[id] = 1
    localStorage.setItem('read_db', JSON.stringify(_));
  }

  table.on('tool(mail-list)', function(obj){
    var data = obj.data; //获得当前行数据
    var layEvent = obj.event; //获得 lay-event 对应的值（也可以是表头的 event 参数对应的值）
    var m_body = "";
    var m_attac = [];
    var title = "";
    var reg= new RegExp('cid:[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+','g');
    var href_reg = new RegExp('\<a\ href', 'g');

    if (layEvent == "detail"){
      title += "from: <span>"+data.headers.from+"</span>&nbsp;";
      title += "subject: <span style='white-space: nowrap'>"+data.subject+"</span>&nbsp;";
      title += "date: <span>"+timeconvert(data.timestamp)+"</span>";


      if (data.hasOwnProperty('attachments')){
        data.attachments.forEach(function(d){
          imgconver[d.contentId] = 'https://www.snapmail.cc/email/'+data.id+'/attachment/'+d.fileName;
          f = '<span id="'+d.contentId+'" onclick="downfile(this)">'+d.fileName+'</span>';
          m_attac.push(f);
        })
      };

      if (data.hasOwnProperty('html')){
        cids=data.html.match(reg);
        m_body = data.html

        if (cids){
          cids.forEach(function(d){
            img_cid = d.replace('cid:', '');
            if (imgconver.hasOwnProperty(img_cid)){
              img = imgconver[img_cid];
              m_body = m_body.replace(d, img);
            }
          })
        }

        m_body = m_body.replace('<a href', '<a onclick="window.openfile(this.href)" href');

      } else {
        m_body = data.text
      }

      $('#m-body').html(m_body);
      $('#m-attach').html(m_attac.join(' '));

      layer.open({
        type: 1,
        area: ['80%', '70%'],
        title: title,
        content: $('#mail'),
      });

      // 设置已读
      set_read(data.id);

    } else if (layEvent == "del") {
      if (confirm('确定删除?')){
        $.ajax({
          type: 'DELETE',
          url: 'https://www.snapmail.cc/email/'+ data.id,
          success: function(res){
            console.log(res);
            obj.del();
            T.reload();
          }
        });
      }
    }

  });


  function fresh_list(){
    var _t = {'code' : 0, 'count': 0, 'data': []};

    function load_table(d){
      T = table.render({
        elem: '#maillist',
        url: 'https://www.snapmail.cc/emailList/' + gen_account(),
        skin: 'line',
        page: true,
        limits: [50,100],
        loading:true,
        text: {'none': '还没有收到邮件哦'},
        cols: [[ //表头
          {field: 'from', title: 'From', templet:function(d){
            if (is_read(d.id)){
              return d.from[0].name;
            } else {
              return '<span class="layui-badge-dot layui-bg-orange"></span>&nbsp;' + d.from[0].name;
            }
          }},
          {field: 'subject', title: 'subject', templet: function(d){
            if (d.hasOwnProperty('attachments')){
              return d.subject + '<img src="img/attach.png" width=16 height=16></img>';
            } else {
              return d.subject;
            }
          }},
          {field: 'date', title: 'Date', templet: function(d){
            return timeconvert(d.timestamp);
          }},
          {title: 'Tools', toolbar:'#toolbar'}
        ]],
        parseData: function(res){
          return {
            code: 0,
            count: res.length, 
            data: res
          }
        },
        error: function(xhr, err){
          $('.layui-none')[0].innerText = '还没有收到邮件哦';
        }
      });
    }

    load_table('x');
  }

  gen_account();
  fresh_list();
  $('#refresh').click(function(){fresh_list()});
});

function downfile(f){
  window.openfile(imgconver[f.id]);
}

