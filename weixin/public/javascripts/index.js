$(function(){
    var Config = {
        urlR: /^(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?$/,
        titleR: /^([\u4e00-\u9fa5]|[0-9_a-zA-Z]){1,28}$/,
        summaryR: /^([\u4e00-\u9fa5]|[0-9_a-zA-Z]){1,30}$/,
        cdnPath: 'http://7xt6pd.com1.z0.glb.clouddn.com/citibank/',
        basePath: window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1)
    }
    cookie.expiresMultiplier = 60 * 60
    // Vue.config.delimiters = ["[[","]]"];
    var app = new Vue({
        el: '#app',
        data: {
            baseUrl: Config.basePath,
            account: '',
            password: '',
            filter: '',
            list: [],
            links: [],
            totalCount: 0,
            pageIndex: 1,
            pageSize: 20,
            pageInput: 1,
            sortKey: 'ordernumber',
            sortOrders: { 'ordernumber': -1, 'createtime': -1, 'updatetime': -1 },
            isLogin: cookie.get('rp-admin-404') || false,
            loginError: false,
            isEditing: false,
            isAdding: false,
            isnormodel: true,
            ispicmodel: false,
            isadmodel: false,
            currentItem: {},
            currentIndex: 0,
            newLink: {},
            selectedLink: {},
            keyword:'',
            ifstandardmodel:'0'
        },
        ready: function(){
            $(this.$el).show()
            // this.loadData()
            if(this.isLogin){
                this.loadData()
            }
        },
        methods: {
            login: function(){
                var self = this
                $.ajax({
                    url: '/login',
                    type: 'post',
                    dataType: 'json',
                    data: {
                        account: self.account,
                        password: self.password
                    },
                    success: function(data){
                        if(data.code === 200){
                            if(data.msg === 'success'){
                                self.isLogin = true
                                cookie.set('rp-admin-404', 'admin', {expires: 30})
                                self.loadData()
                            }else{
                                self.loginError = true
                            }
                        }
                    }
                })
            },
            loadData: function(){
                var self = this
                $.ajax({
                    url: 'services/app/list',
                    type: 'get',
                    dataType: 'json',
                    data: {
                        ifstandardmodel: self.ifstandardmodel,
                        keyword: self.keyword,
                        pageIndex: self.pageIndex,
                        pageSize: self.pageSize,
                        orderBy: self.sortKey,
                        orderType: self.sortOrders[self.sortKey]>0?'asc':'desc'
                    },
                    success: function(data){
                        if(data.errcode === 0){
                            self.list = data.payload.list
                            self.totalCount = data.payload.count
                        }
                    }
                })
            },
            loadAdData: function(){
                var self = this
                $.ajax({
                    url: 'services/ad/list',
                    type: 'post',
                    dataType: 'json',
                    data: {
                        keyword: self.keyword,
                        pageIndex: self.pageIndex,
                        pageSize: self.pageSize,
                        orderBy: self.sortKey,
                        orderType: self.sortOrders[self.sortKey]>0?'asc':'desc'
                    },
                    success: function(data){
                        if(data.errcode === 0){
                            self.list = data.payload.list
                            self.totalCount = data.payload.count
                        }
                    }
                })
            },
            normodel: function(){
                var self = this
                self.ifstandardmodel = '0'
                self.isnormodel = true
                self.ispicmodel = false
                self.loadData()
            },
            picmodel: function(){
                var self = this
                self.ifstandardmodel = '1'
                self.ispicmodel = true
                self.isnormodel = false
                self.loadData()
            },
            admanage: function(){
                var self = this
                self.ispicmodel = false
                self.isnormodel = false
                self.isadmodel = true
                console.log('here')
                self.loadAdData()
            },
            removeItem: function(it){
                var self = this
                var index = self.list.indexOf(it)
                var item = self.list[index]
                if(confirm('是否删除'+item.title+'?')){
                    $.ajax({
                        url: 'services/app/delete',
                        type: 'post',
                        dataType: 'json',
                        data: {
                            id: item.id
                        },
                        success: function(data){
                            if(data.errcode === 0){
                               self.loadData()
                            }
                        }
                    })
                }
            },
            addItem: function(){
                this.isAdding = true
            },
            saveItem: function(){
                var self = this
                var newItem = self.newItem
                if(!newItem.title || !newItem.applink || !newItem.piclink){
                    alert('请完成一些必要信息')
                    return
                }

                if(!Config.urlR.test(newItem.applink) || !Config.urlR.test(newItem.piclink)){
                    alert('作品链接或封面链接不是一个有效的url地址')
                    return
                }
                $.ajax({
                    url: 'services/app/add',
                    type: 'post',
                    dataType: 'json',
                    data: newItem,
                    success: function(data){
                        if(data.errcode === 0){
                            window.location.href = '/'
                        }
                    }
                })
            },
            editItem: function(it){
                var self = this
                var index = self.list.indexOf(it)
                var item = self.list[index]
                self.currentIndex = index
                self.isEditing = true
                self.currentItem = $.extend({}, item)
            },
            updateItem: function(){
                var self = this
                var newItem = self.currentItem

                if(!newItem.title || !newItem.applink || !newItem.piclink){
                    alert('请完成一些必要信息')
                    return
                }

                if(!Config.urlR.test(newItem.applink) || !Config.urlR.test(newItem.piclink)){
                    alert('作品链接或者封面链接不是一个有效的url地址')
                    return
                }
                $.ajax({
                    url: 'services/app/update',
                    type: 'post',
                    dataType: 'json',
                    data: newItem,
                    success: function(data){
                        if(data.errcode === 0){
                            self.list[self.currentIndex] = newItem
                            self.goBack()
                        }
                    }
                })
            },
            search: function(){
                var self = this
                self.loadData()
                alert(self.keyword)
            },
            goBack: function(){
                this.isAdding = false
                this.isEditing = false
            },
            getPage: function(page){
                if(page <= 0 || page > this.totalPage || page === this.pageIndex){
                    return
                }
                this.pageIndex = Number(page)
                this.loadData()
            },
            sortBy: function(key){
                this.sortKey = key
                this.sortOrders[key] = this.sortOrders[key] * -1
            },
            isLogout: function(){
                // if(cookie.get('app-admin-account')){
                //     this.account = cookie.get('app-admin-account')
                //     this.password = cookie.get('app-admin-pwd')
                //     this.login()
                // }else{
                    this.isLogin = false
                    cookie.remove('app-links-admin')
                // }
            }
        },
        computed: {
            totalPage: function(){
                return Math.ceil(this.totalCount/this.pageSize)
            }
        }
    })
    var clipboard = new Clipboard('.clip-btn')

    clipboard.on('success', function(e) {
        alert('复制成功\n' + e.text)
    })

})