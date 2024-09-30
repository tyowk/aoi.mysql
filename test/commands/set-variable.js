module.exports = [{
    name: 'set',
    code: `variable value set to: **$nonEscape[$message]**
    $setVar[test;$nonEscape[$message];test]
    $onlyIf[$nonEscape[$message]!=;please give the value!]`
},{
    name: 'reset',
    code: `variable value has been reset to default.
    $setVar[test;value;test]`
}]
