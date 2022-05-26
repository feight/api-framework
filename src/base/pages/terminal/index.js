
/* eslint-disable id-blacklist */

const terminal = {

    // Make request to the server
    callServer(term, cmd, callback){

        $.ajax({
            data: cmd.data,
            dataType: "json",
            error: (jqXHR) => {

                if(jqXHR.status === 404){

                    this.tryFindCommand(term, cmd);

                }else{

                    this.renderError(term, jqXHR.responseText);

                }

            },
            success: (response) => {

                if(cmd.route === "meta"){

                    const docs = $.extend({}, this.programs, response);
                    const meta = this.compileMeta(docs);

                    this.renderMeta(term, meta);

                }else{

                    const indent = 4;

                    callback(response.result || JSON.stringify(response, false, indent));

                }

            },
            url: this.options.apiBaseUrl + cmd.route
        });

    },

    // Create the meta data object that will be used by renderMeta()
    compileMeta(obj){

        const result = {
            descOffset: 20,
            docs: {}
        };

        $.each(obj, (i, e) => {

            const route = e.url || i;

            if(route === "meta"){
                return;
            }

            /*
             * So the goal here is to create a hierarchial object from the
             * route... therefore if the route is "foo/bar/baz" we need
             * to have { foo: { bar: { baz: options } } }
             *
             * this will then get merged with all the others to create a nice
             * hierarchial structure for the help menu
             */

            //  ...this is probaby not the best way to do this, but it's just so easy..

            const routeSplit = route.split("/");

            const doc = JSON.parse(
                `{"${ routeSplit.join(["\":{\""])
                }":{"opts":${ JSON.stringify(e) }}${
                    new Array(routeSplit.length).join("}") }}`
            );

            // Merge with all the others
            $.extend(true, result.docs, doc);

            /*
             * Set the description text offset to the route with the most chars
             *
             */
            if(route.length > result.descOffset){
                result.descOffset = route.length;
            }

        });

        return result;

    },

    // Gets a command and it's arguments
    getCommandAndArguments(input){

        let route = input;
        const data = {};

        const argIndex = route.indexOf(" --");

        // There are arguments
        if(argIndex !== -1){

            const args = route.substring(argIndex).split(" --");

            $.each(args, (index, ent) => {

                if(ent !== ""){

                    /*
                     * Param string looks something like this:
                     *
                     *      --bar foo baz (implies that bar="foo baz")
                     *      --bar (implies that bar=1)
                     *
                     */

                    // Entire param string (--bar foo)
                    const param = ent.trim();

                    // End index of param key
                    const paramKeyEnd = param.indexOf(" ");

                    // Param name defaults to param string
                    let paramKey = param;

                    // Default value
                    let paramValue = "1";

                    // If the param has a value assigned
                    if(paramKeyEnd !== -1){

                        paramKey = param.substring(0, paramKeyEnd).trim();
                        paramValue = param.substring(paramKeyEnd).trim();

                    }

                    // Remove any quotation marks if at begin/end
                    if(paramValue.charAt(0) === "\""){

                        // Remove fist quote
                        paramValue = paramValue.slice(1);

                    }

                    if(paramValue.charAt(paramValue.length - 1) === "\""){

                        // Remove last quote
                        paramValue = paramValue.slice(0, paramValue.length - 1);

                    }

                    data[paramKey] = paramValue;

                }

            });

            route = route.substring(0, argIndex).trim();

        }

        return {
            data,
            route: route.replace(/ /g, "/")
        };

    },

    initialize(opts){

        this.options = $.extend({}, {
            apiBaseUrl: "/apiv1/",
            greeting: "Welcome to {{name}} terminal.\nUse --help on a command for more info.\n",
            metaUrl: "/apiv1/meta",
            name: "term1",
            prompt: "term1> "
        }, opts);

        $(this.options.container).terminal((input, term) => {

            this.onInput(input, term);

        }, {
            greetings: this.options.greeting.replace("{{name}}", this.options.name),
            name: this.options.name,
            prompt: this.options.prompt
        });

    },

    onInput(input, term){

        if(input !== ""){

            const commands = this.parseInput(input);

            $.each(commands, (index, ent) => {
                this.runCommands(term, ent);
            });

        }else{

            term.echo("");

        }

    },

    /*
     * Parse the user input to get the routes and parameters
     *
     *  - this will return all commands.. commands are seperated by
     *      a pipe (|) for output piping and && for chaining.
     */
    parseInput(input){

        const chain = input.trim().split("&&");
        const result = [];

        $.each(chain, (index, ent) => {

            const pipes = [];

            $.each(ent.trim().split("|"), (indexInner, entInner) => {

                let f = entInner.trim();

                if(
                    $.inArray(f, [
                        "help",
                        "--help",
                        "ls",
                        ""
                    ]) !== -1
                ){
                    f = "meta";
                }

                if(f.substring(0, 2) === "ls"){
                    f = f.substring(2);
                }

                pipes.push(this.getCommandAndArguments(f));

            });

            result[index] = pipes;

        });

        return result;

    },

    // Built-in programs
    programs: {
        grep: {
            args: {

                e: {
                    desc: "expression"
                }
            },
            callable(cmd, pipedInput, callback){

                const input = pipedInput || "";
                const lines = input.split("\n");
                const search = $.grep(lines, (n) => n.indexOf(cmd.data.e) > -1);

                callback(search.join("\n"));

            },
            desc: "search for lines matching an expression"
        },
        subscribe: {
            args: {
                exit: {
                    desc: "close the event window"
                },
                to: {
                    desc: "channel to subscribe i.e. /events/all"
                }
            },
            callable(cmd, pipedInput, callback){

                if(cmd.data.exit){

                    $("#term").removeClass("ws");
                    $("#ws").hide();

                    return;

                }

                if(!cmd.data.to){
                    cmd.data.to = "/events/all";
                }

                $("#term").addClass("ws");
                $("#ws").show();

                callback(`\nsubscribed to ${ cmd.data.to }`);

            },
            desc: "subscribe to a channel for realtime updates"
        },
        exit:{
            callable(cmd, pipedInput, callback){
                window.location = "/";
            }
        }
    },

    // Render command help when --help flag is used
    renderCommandHelp(term, cmd){

        $.get(this.options.metaUrl, (response) => {

            const docs = $.extend({}, this.programs, response);

            const doc = docs[cmd.route];

            if(doc){

                let text = `\n[[i;;]${ doc.url }]\n\n`;

                if(doc.desc){
                    text += `[[;#000000;#2993FB] ${ doc.desc } ]\n\n`;
                }

                let descOffset = 20;
                const n = 5;

                $.each(doc.args, (i) => {
                    if(i.length > descOffset){
                        descOffset = i.length + n;
                    }
                });

                $.each(doc.args, (i, e) => {
                    text += `${
                        i +
                        new Array(descOffset - i.length).join(" ") +
                        (e.type || "string") + (e.required ? ", required" : "") +
                        (e.desc ? ` (${ e.desc })` : "")
                    }\n`;
                });

                term.echo(text);

            }else{

                this.tryFindCommand(term, cmd);
            }

        });

    },

    // Write the server error response to the terminal
    renderError(term, response){

        const obj = JSON.parse(response);

        term.echo(`\n[[;#CB0814;]${ obj.error }]\n`);

    },

    //  Render the meta object that was created with compileMeta()
    renderMeta(term, meta){

        term.echo(
            "\n-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\n\n" +
                "  -Use --help on a command for more info.\n" +
                "  -Use --p on a command to enable parameter prompts.\n\n" +
                "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\n"
        );

        $.each(meta.docs, (i, part) => {

            let help = "";

            if(part.opts){

                // This is the end of the route
                help += `[[i;#2993FB;]${ i }]${ new Array(meta.descOffset - i.length).join(" ") }  ${ part.opts.desc }`;

            }else{

                // This is just one part of the route
                help += `[[;#1FCB23;]${ i }]`;

                // Go a second level...
                $.each(part, (j, part2) => {

                    if(part2.opts){
                        help += `\n  [[i;#2993FB;]${ j }]${ new Array(meta.descOffset - j.length).join(" ") }${ part2.opts.desc }`;
                    }else{
                        help += `\n  [[;#1FCB23;]${ j }] ..`;
                    }

                });

            }

            term.echo(`${ help }\n`);

        });

    },

    runCommand(term, cmd, pipedInput, callback){

        if(cmd.data.help){

            this.renderCommandHelp(term, cmd);

        }else if(this.programs[cmd.route]){

            this.programs[cmd.route].callable(cmd, pipedInput, callback);

        }else{

            this.callServer(term, cmd, callback);
        }

    },

    runCommands(term, commands, lastResult){

        if(commands.length > 0){

            this.runCommand(term, commands[0], lastResult, (result) => {

                commands.shift();

                this.runCommands(term, commands, result);

            });

        }else{

            term.echo(`[[;#CDCB2B;]${ lastResult }]\n`);

        }

    },

    // Try to find a command if a 404 was returned
    tryFindCommand(term, cmd){

        $.get(this.options.metaUrl, (response) => {

            const docs = [];

            $.each(response, (index, ent) => {

                const routeKey = ent.url;

                if(routeKey.indexOf(cmd.route) === 0){

                    let newKey = "";
                    const routeSplit = cmd.route.split("/");
                    const routeKeySplit = routeKey.split("/");
                    const routeKeySplitAllWithLast = routeKeySplit.slice(0, routeSplit.length + 1);
                    let routeKeySplitAllButLast = routeKeySplit.slice(0, routeSplit.length);

                    /*
                     * If the input was partially found... check if the last two keys
                     * are equal as to not duplicate the path.
                     */
                    if(routeKeySplitAllButLast[routeKeySplitAllButLast.length - 1] === routeKeySplit[routeKeySplit.length - 1]){
                        routeKeySplitAllButLast = routeKeySplit.slice(0, -1);
                    }

                    newKey = `.. \\n${ routeKeySplitAllButLast.join(" ") }/${ routeKeySplitAllWithLast[routeKeySplitAllWithLast.length - 1] }`;

                    if(routeKeySplit.length > routeSplit.length + 1){

                        // The current route is not a command, just part of the path
                        newKey += "/";

                    }

                    ent.url = newKey;

                    docs.push(ent);

                }

            });

            if(docs.length !== 0){

                term.echo(`\n[[;#CDCB2B;]Commands starting with "${ cmd.route.replace("/", " ") }"...]\n`);

                const meta = this.compileMeta(docs);

                this.renderMeta(term, meta);

            }else{

                term.echo("\n[[;#CB0814;]command not found]\n");

            }

        });

    }

};

document.addEventListener("DOMContentLoaded", () => {

    terminal.initialize({
        container: "#term",
        name: "Cosmos",
        prompt: `cosmos@${ window.location.hostname }:~#`
    });

});

/* eslint-enable id-blacklist */
