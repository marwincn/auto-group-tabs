# Auto Group Tabs

Chrome浏览器在85版本发布了标签页分组功能，但是需要手动对标签页的分组进行管理。`Auto Group Tabs`是一款浏览器扩展，实现*新打开标签页*或*标签页地址切换*时自动进行分组，用户可以自定义分组的规则，如按照域名分组或按照标签页标题关键词分组。

可以在Chrome网上应用商店安装此扩展：[link](https://chrome.google.com/webstore/detail/auto-group-tabs/mnolhkkapjcaekdgopmfolekecfhgoob)

![M7dYZU8Ca6HJpwr](https://i.loli.net/2021/10/06/M7dYZU8Ca6HJpwr.jpg)

# 自行构建程序

环境要求：
* Mac OS 或 Linux 操作系统
* 安装npm

> 目前build脚本不支持在Windows环境上运行，如果你有想法欢迎提PR


下载依赖：
```shell
npm install
```


构建：
```shell
npm run build
```


构建完成后根目录下会出现`build/`目录，在浏览器扩展页面打开`开发者模式`后，点击`加载已解压的扩展程序`，选择刚才生成的build目录即可。

![oRZdQ8buGXJDylp](https://i.loli.net/2021/10/06/oRZdQ8buGXJDylp.png)