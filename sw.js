const version='1.2';

const appAssets=[
    'index.html',
    'index2.html',
    'main.js',
    'images/flame.png',
    'images/logo.png',
    'images/sync.png',
    'vendor/bootstrap.min.css',
    'vendor/jquery.min.js'
];

self.addEventListener('install',function(e){

    e.waitUntil(
        caches.open(`static-${version}`)
        .then(cache=>cache.addAll(appAssets))
    ); 
     
});

self.addEventListener('activate',function(e){

    let activatePromise=new Promise(function(resolve,reject){

            let cleaned=caches.keys().then(function(keys){
                //刪除所有static跟不是static-version的cache
                keys.forEach(function(key){

                    if(key!==`static-${version}` && key.match(`static-`)) {
                        return caches.delete(key);
                    } 
                    //return caches.delete(key);

                });
                console.log('sw:activate');
                resolve();
            });
    });
    
    e.waitUntil(activatePromise); 
});

const staticCache=function(req,cacheName=`static-${version}`){

    return caches.match(req).then(function(catchedRes){
       
         //從cache找到
         if(catchedRes){
             return catchedRes;
         }
         //沒找到從網路找並加入cache
         return fetch(req).then(function(networkRes){

              caches.open(cacheName)
              .then(function(cache){

                  cache.put(req,networkRes);

              });

         });

    });
}

const clearCache=function(cacheName){


}

const fallbackCache=function(req){

     return fetch(req).then(function(response){

           if(!response.ok){
              throw 'Fetch Error!';
           }
           
           caches.open(`static-${version}`)
           .then(function(cache){

               cache.put(req,response);

           });

           return response.clone();

     }).catch(function(error){
           //console.log(error);
           return caches.match(req);
     });

} 

self.addEventListener('fetch',function(e){
     //console.log(e.request.url);
     
     //更版
     if(e.request.url.match('version.json')){
        console.log('fetch:version');
        fetch(e.request.url).then(function(response){
            return response.json();
        }).then(function(obj){
            let newobj=obj;
            let newversion=newobj.version;
            let oldversion=parseFloat(version);
            
            console.log('oldver:'+oldversion+"/ newver"+newversion);

            if (oldversion<newversion){
                //clear cache
                caches.keys().then(function(keys){
               
                    keys.forEach(function(key){
                        return caches.delete(key);
                    });
                    console.log('clear caches');                    
                });

            }
            //console.log(newobj.version);
        });
     }

     //捕捉的url跟當前的url一樣
     if (e.request.url.match(location.origin)){

         //console.log(staticCache(e.request));
         e.respondWith(staticCache(e.request));
         //e.respondWith(fallbackCache(e.request));

     }else if(e.request.url.match('api.giphy.com/v1/gifs/trending')){
         console.log('fetch:giphy');
         e.respondWith(fallbackCache(e.request));
         //console.log(fallbackCache(e.request));
     }else if(e.request.url.match('giphy.com/media')){
        console.log('fetch:giphy2');
        e.respondWith(staticCache(e.request,'gipyh'));
     }

}); 
