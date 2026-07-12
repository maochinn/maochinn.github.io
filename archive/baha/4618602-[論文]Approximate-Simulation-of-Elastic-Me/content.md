# [論文]Approximate Simulation of Elastic Membrances by Triangulated Spring Meshes

> 2019-12-12 · 未分類 · GP 0 · 來源 https://home.gamer.com.tw/artwork.php?sn=4618602

剛報完paper

有空再寫完...

(在巴哈寫這種學術性的東西是否搞錯了什麼...

  

  

//內容...

有限元素分析法

講白話一些，就是他會將一個問題拆分成一個一個的(有限的)element，

也就把它離散化，可以想像成類比轉到數位，這中間一定會有損失，

所以原則上有使他更準確就有兩種方式

1.切更多element

2.用更複雜的多項式去近似

  

有限元素分析法原則上就是一種[邊值問題](https://zh.wikipedia.org/wiki/边值问题)

也就是你要給一定的限制，或者說是條件，

根據給的限制得到一個解。

  

與其相對的就是iteration的方法，

可以想像最簡單的牛頓求根法，

而直接公式解就像是有限元素分析，

是直接解一個線性系統。

  

但顯然的iteration的方法較為直觀且容易實作，

而解線性系統則相對複雜且耗時。

  

這個問題也就是這篇論文想做的事情

也就是用簡單的spring mesh去近似所謂的CST

...

  

  

後話:

雖然是做圖學的，但有限元素分析法也只有聽過，

然後一大堆物理材料的觀念，讓我在看這篇的時候還蠻頭大的。

  

等以後有空再研究有沒有其他平台好用的，

感覺發巴哈怪怪的

  

  

References:

有限元素分析

fundamentals-of-finite-element-analysis(FE的教科書)

[投影片](http://tlrc.niu.edu.tw/downloadfiles/A/A04/A04.pdf)(宜蘭大學的投影片，可以跟上面的書一起看)

[CST](http://homepages.rpi.edu/~des/CST.pdf)

[CST](http://mae.uta.edu/~lawrence/me5310/course_materials/me5310_notes/7_Triangular_Elements/7-2_Constant_Strain_Triangle_CST/7-2_Constant_Strain_Triangle_CST.htm)

  

  

[應力應變關係](http://mae.uta.edu/~lawrence/me5310/course_materials/me5310_notes/5_Solid_Mechanics/5-4_Hookexxxs_Law/5-4_Hookexxxs_Law.htm)

[應力矩陣](https://kknews.cc/zh-tw/education/o3bqq2q.html)、[應力應變關係](https://kknews.cc/zh-tw/education/jky6l8e.html)、[應力應變曲線](https://kknews.cc/education/n6oa8x5.html)

  

[isotropic](https://www.ptt.cc/bbs/Physics/M.1317297707.A.86A.html)

[homogeneous and isotropic](https://physics.stackexchange.com/questions/153008/what-is-difference-between-homogeneous-and-isotropic-material/153015)

  

$('article.c-text img').load(function () { // 表格內圖片大於表格寬時，設為 100% if ($(this).parents('table').length != 0) { if ($(this).width() >= $(this).parents('td').width()) { $(this).width('100%'); } else { $(this).width($(this).width() + 'px'); } } });
