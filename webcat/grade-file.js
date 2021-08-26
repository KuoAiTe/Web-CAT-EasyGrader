const hideLineNumbers = async () => {
  let attempts = 0;
  let iframeContent;
  let lineNumbers;
  do {
    iframeContent = $('iframe').contents();
    lineNumbers = $('td.lineCount', iframeContent);
    highlightLineNumbers = $('td.lineCountHilight', iframeContent);
    await timeout(50);
  } while (lineNumbers.length == 0 && attempts++ < 100);
  // Remove indentation
  lineNumbers.each( function() {
    const newContent = $(this).html().replace(REGEX.START_WITH_SPACES, '');
    $(this).html(newContent);
  });

  highlightLineNumbers.each( function() {
    const newContent = $(this).html().replace(REGEX.START_WITH_SPACES, '');
    $(this).html(newContent);
  });
  const target = $('tr[id^=N]', iframeContent);
  if (lineNumber) {
    $('tr', iframeContent).removeClass('Warning Error');
    lineNumbers.hide();
    highlightLineNumbers.hide();
    target.hide();
  } else {
    lineNumbers.show();
    highlightLineNumbers.show();
    target.show();
  }
}


const hideMessageBoxes = async () => {
  let attempts = 0;
  let messageBoxes;
  do {
    messageBoxes = $('td.messageBox', $('iframe').contents());
    await timeout(50);
  } while (messageBoxes.length == 0 && attempts++ < 100);
  (lineNumber) ? messageBoxes.hide() : messageBoxes.show();
}

const removeSrcLines = async () => {
  let attempts = 0;
  let srcLines;
  let iframeContent;
  do {
    iframeContent = $('iframe').contents();
    srcLines = $('pre.srcLine', iframeContent);
    await timeout(10);
  } while (srcLines.length == 0 && attempts++ < 300);
  $('table', iframeContent).css('width', '100%');
  if (lineNumber) {
    srcLines.css('padding-left', '0px');
    $('body', iframeContent).css('margin', '0px');
  } else {
    srcLines.css('padding-left', '10px')
    $('body', iframeContent).css('margin', '8px');
  }

  srcLines.each( function() {
    const newContent = $(this).html().replace(REGEX.START_WITH_SPACES, '');
    $(this).html(newContent);
  });
}
const removeLineNumber = () => {
  hideLineNumbers();
  hideMessageBoxes();
  removeSrcLines();
}
