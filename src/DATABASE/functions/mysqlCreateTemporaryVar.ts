module.exports = async (d: any) => {
    const data = d.util.aoiFunc(d);
    if (data.err) return d.error(data.err);
    const [table, ...vars] = data.inside.splits;
    vars.forEach((x: any) => {
        const [name, value] = x.split(":");
        d.client.variableManager.add(
            {
                name: name?.addBrackets(),
                value: value?.addBrackets(),
                table: table === "" ? d.client.mysql.tables[0] : table.addBrackets(),
            },
            table === "" ? d.client.mysql.tables[0] : table,
        );
    });
    return {
        code: d.util.setCode(data)
    }
}