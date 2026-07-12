# [CG]電腦圖學-OpenGL

> 2018-01-19 · 電腦圖學(CG) · GP 2 · 來源 https://home.gamer.com.tw/artwork.php?sn=3859575

文章已更新至:[Medium](https://medium.com/maochinn/電腦圖學00-opengl-fa7105f59ecd?source=---------5-----------------------)

  

WIKI名詞解釋:

  

**[電腦圖學](https://zh.wikipedia.org/wiki/计算机图形学)**（英語：**computer graphics**，[縮寫](https://zh.wikipedia.org/wiki/縮寫)為**CG**）

這邊要介紹CG跟那些H-GXME的CG不一樣(´・ω・\`)

我絕對不是因為誤會而去修這堂課的

  

  

**[OpenGL](https://zh.wikipedia.org/wiki/OpenGL)**（英語：_Open Graphics Library_，

譯名：**開放圖形庫**或者「開放式圖形庫」）

總之就是一個函式庫，衍伸的東西很多

重要概念是，使用OpenGL的函式多半跟一般函式不一樣，呼叫CPU做某件事

而是在一個已經建構好的圖形管線中更改參數

圖形管線包含一系列畫出圖形的過程，

依據每個步驟，加上不同效果

最後再將整個流水線跑過，繪出圖片

  

也就是說，OpenGL有大量常數用來設定每個步驟所需的參數

  

而接下來的介紹，也包含自己的筆記

是利用C/C++的OpenGL來實作CG上的效果

從2D的圖形開始，到有3D渲染的圖形

  

另外，這邊會運用到的函式庫是gl, glu, glut

也就是OpenGL, GLU, GLUT

  

我地參考來自網路，教授的講義和一本CG的書

Interactive computer graphics A Top-Down Approach Using OpenGL Third Edition

  

我們下一篇再見吧~

$('article.c-text img').load(function () { // 表格內圖片大於表格寬時，設為 100% if ($(this).parents('table').length != 0) { if ($(this).width() >= $(this).parents('td').width()) { $(this).width('100%'); } else { $(this).width($(this).width() + 'px'); } } });
