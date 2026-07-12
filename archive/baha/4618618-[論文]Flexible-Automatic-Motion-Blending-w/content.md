# [論文]Flexible Automatic Motion Blending with Registration Curves

> 2019-12-12 · 未分類 · GP 1 · 來源 https://home.gamer.com.tw/artwork.php?sn=4618618

咳咳

又是論文，有空再寫完

  

這篇作者算是做這一系列motion capture的大佬，

我這邊有比較讀懂的應該是Motion Path Editing跟這篇

總之就是要讓motion capture出來的東西好操作然後performance好。

  

那這篇主要解決的問題就是，

當有複數個motion在做混合的時候，

會有一些問題，

我感覺就是他們發現一個問題解決一個問題，

阿如果有跑出新的問題，

那就再發一篇paper(傑出的一手?

  

那位甚麼要把動作混合呢?

為甚麼不請演員重新捕捉動做一次呢?

因為如果每一種動作都要捕捉，太浪費時間與空間，

可以想像在玩遊戲的角色的每個在動作再銜接時都要個別拉一個動作，

這應該可以用電腦來幫我們內插出來，

甚至也可以產生新的動作，

但在混合動作上其實會遇到很多問題。

  

...

  

後話:

這一系列算是電腦動畫的paper，

其實一定程度上感受的動畫這坑有多深，

我還是回去畫圖好惹...

  

  

References:

[論文的page](https://research.cs.wisc.edu/graphics/Gallery/kovar.vol/RegistrationCurves/)

[N.C.C.A Bournemouth University的文章](https://nccastaff.bournemouth.ac.uk/jmacey/MastersProjects/Msc05/shane-aherne-thesis.pdf)

[不知道誰的PPT](http://game-tech.com/Talks/KovarParamMotion.ppt)

[也不知道哪來的文章](http://pages.cs.wisc.edu/~kovar/thesis/thesis_regCurves.pdf)

[Motion Blending](http://image.diku.dk/projects/media/kristine.slot.07.pdf)

$('article.c-text img').load(function () { // 表格內圖片大於表格寬時，設為 100% if ($(this).parents('table').length != 0) { if ($(this).width() >= $(this).parents('td').width()) { $(this).width('100%'); } else { $(this).width($(this).width() + 'px'); } } });
