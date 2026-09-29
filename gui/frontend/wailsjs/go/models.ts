export namespace main {
	
	export class Command {
	    Name: string;
	    NameComplete: string;
	    Path: string;
	    Description: string;
	    Use: string;
	
	    static createFrom(source: any = {}) {
	        return new Command(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.NameComplete = source["NameComplete"];
	        this.Path = source["Path"];
	        this.Description = source["Description"];
	        this.Use = source["Use"];
	    }
	}
	export class Flag {
	    Name: string;
	    Description: string;
	    Shorthand: string;
	    Type: string;
	
	    static createFrom(source: any = {}) {
	        return new Flag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.Shorthand = source["Shorthand"];
	        this.Type = source["Type"];
	    }
	}
	export class CommandComplete {
	    Name: string;
	    Short: string;
	    Path: string;
	    Long: string;
	    IsRunnable: boolean;
	    Args: string;
	    Flags: Flag[];
	    SubCommands: Command[];
	
	    static createFrom(source: any = {}) {
	        return new CommandComplete(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Short = source["Short"];
	        this.Path = source["Path"];
	        this.Long = source["Long"];
	        this.IsRunnable = source["IsRunnable"];
	        this.Args = source["Args"];
	        this.Flags = this.convertValues(source["Flags"], Flag);
	        this.SubCommands = this.convertValues(source["SubCommands"], Command);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

