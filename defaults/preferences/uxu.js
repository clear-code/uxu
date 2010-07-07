pref("extensions.uxu.running", false);
pref("extensions.uxu.global", false);

pref("extensions.uxu.profile.enableDebugOptions", true);
pref("extensions.uxu.profile.disableAutoUpdate", true);
pref("extensions.uxu.profile.disableExitWarning", true);
pref("extensions.uxu.profile.disableCheckDefaultWarning", true);

pref("extensions.uxu.run.ignoreHiddenFiles", true);
pref("extensions.uxu.run.timeout", 30000);
pref("extensions.uxu.run.timeout.application", 300000);
pref("extensions.uxu.run.history.expire.days", 30); // days
pref("extensions.uxu.defaultEncoding", "UTF-8");
pref("extensions.uxu.showInternalStacks", false);
pref("extensions.uxu.priority.important", "0.9");
pref("extensions.uxu.priority.high",      "0.7");
pref("extensions.uxu.priority.normal",    "0.5");
pref("extensions.uxu.priority.low",       "0.25");
pref("extensions.uxu.warnOnNoAssertion",  true);
pref("extensions.uxu.action.fireMouseEvent.useOldMethod", false);
pref("extensions.uxu.action.fireKeyEvent.useOldMethod", true);

pref("extensions.uxu.runner.runMode", 0); // 0 = run by priority, 1 = run all
pref("extensions.uxu.runner.runParallel", false);
pref("extensions.uxu.runner.editor", "/usr/bin/gedit +%L %F");
pref("extensions.uxu.runner.editor.defaultOptions.hidemaru.exe", "/j%L,%C \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.terapad.exe", "/j=%L \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.sakura.exe", "\"%F\" -X=%C -Y=%L");
pref("extensions.uxu.runner.editor.defaultOptions.emeditor.exe", "/l %L /cl %C \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.xyzzycli.exe", "-l \"%F\" -g %L -c %C");
pref("extensions.uxu.runner.editor.defaultOptions.moe.exe", "\"%F\" -m %L,%C");
pref("extensions.uxu.runner.editor.defaultOptions.gedit", "+%L %F");
pref("extensions.uxu.runner.editor.defaultOptions.vim", "+%L \"%F\"");
pref("extensions.uxu.runner.editor.defaultOptions.gnuclient", "+%L \"%F\""); // Emacs
pref("extensions.uxu.runner.alwaysRaised", false);
pref("extensions.uxu.runner.autoShowContent", true);
pref("extensions.uxu.runner.autoExpandWindow.sourceViewer", true);
pref("extensions.uxu.runner.autoStart", false);
pref("extensions.uxu.runner.autoStart.oneTime.enabled", true);
pref("extensions.uxu.runner.autoStart.oneTime", false);
pref("extensions.uxu.runner.autoExit", false);
pref("extensions.uxu.runner.lastPath", "");
pref("extensions.uxu.runner.lastResults", "");
pref("extensions.uxu.runner.coloredDiff", true);

pref("extensions.uxu.auto.start", false);
pref("extensions.uxu.auto.exit",  true);
pref("extensions.uxu.port",       4444);
pref("extensions.uxu.allowAccessesFromRemote", false);
pref("extensions.uxu.allowAccessesFromRemote.allowedList", "127.0.0.1,localhost,192.168.*.*");
pref("extensions.uxu.autoStart.oneTime.enabled", true);
pref("extensions.uxu.autoStart.oneTime", false);
pref("extensions.uxu.autoStart.oneTime.port", 0);

pref("extensions.uxu@clear-code.com.name", "chrome://uxu/locale/uxu.properties") ;
pref("extensions.uxu@clear-code.com.description", "chrome://uxu/locale/uxu.properties") ;
