# [Blender2.8]建置專案

> 2019-10-05 · Blender · GP 0 · 來源 https://home.gamer.com.tw/artwork.php?sn=4550425

本文已搬運、更新到[medium](https://medium.com/maochinn/blender-2-8-建置專案-6ccfafa0749f)

  

因為研究所需求，要用blender來開發東西，

這邊順便紀錄一下怎麼處理一些東西。

剛好最近2.8版也出來一陣子了，

主要介紹怎麼把整個code pull下來，然後建置出來。

(如果只是要跑程式的話，也可以直接去載個steam上面也有)

  

原則上只要照著[官網](https://wiki.blender.org/wiki/Building_Blender/Windows)上的步驟去做就好了，

但這邊還是稍微解釋一下。

  

首先是前面要安裝的的tools，

VS2019，要裝C++的IDE

SlikSVN，有一些資源是在Subversion上的

Gitcode，都放在git上

CMakebuild，那些code用的

  

然後接下來這邊都是用cmd來做的

把source code載下來

這邊要建一個獨立的資料夾blender-git(名子可以自己取，我自己事建在D槽)

cd C:\\blender-git

git clone git://git.blender.org/blender.git

  

載完會發現多一個"blender"的資料夾，

裡面會有一個"make.bat"，它可以幫你做一些事，包含下面的make update...

接下來把libraries載下來

cd C:\\blender-git\\blender

make update

  

載完會發現多個"lib"資料夾

所以現在的結構會變成

blender-git/

├──blender/

└──lib/

  

接下來就要build出來了，

這一部可以自己用cmake自己設定，也可以用"make.bat"的make full來幫你做

cd C:\\blender-git\\blender

make full

  

如果是用make full成功的話會顯示下面的東西

Blender successfully built, run from: C:\\blender-git\\build\_windows\_Full\_x64\_vc14\_Release\\bin\\Release

  

版本可能會不太一樣，取決於偵測到甚麼版本的compiler

如果是自己cmake那你也應該知道這邊要幹嘛惹。

  

結束就會長這樣

blender-git/

├──blender/

├──build\_windows\_Full\_x64\_vc14\_Release/

└──lib/

  

接下來要進去build的資料夾把Blender.sl打開編譯，

這邊要建置3個

ALL\_BUILD

INSTALL

blender

  

建置完把blender設為起始專案去跑就會執行了，

或是你進到

blender-git/

├──blender/

├──build\_windows\_Full\_x64\_vc14\_Release/bin/Release/blender.exe

└──lib/

Release這個資料夾，如果你建置的是release版的話

裡面有個blender.exe，跑下去也是一樣的

  

這邊也可以用cmd去執行

cd D:\\blender-git\\build\_windows\_Full\_x64\_vc16\_Release\\bin\\Release

blender.exe

  

原則上能夠跑程式就算是OK惹

以上!

$('article.c-text img').load(function () { // 表格內圖片大於表格寬時，設為 100% if ($(this).parents('table').length != 0) { if ($(this).width() >= $(this).parents('td').width()) { $(this).width('100%'); } else { $(this).width($(this).width() + 'px'); } } });
