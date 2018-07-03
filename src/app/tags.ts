import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as TAGS from '../assets/tags.json';

export class TagNode {
    constructor(public item:string, public children?: Array<TagNode>) {};
}

export class TagFlatNode {
    item: string;
    level: number;
    expandable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TagDatabase {
    dataChange = new BehaviorSubject<Array<TagNode>>([]);
    get data(): Array<TagNode> { return this.dataChange.getValue(); }

    constructor() {
        this.initialize();
    }

    initialize() {
        const data = this.build(TAGS);
        this.dataChange.next(data);
    }

    public getChildren(key) {
      for(let e of this.data) {
        if(e.item === key)
          return e.children;
      }

      return undefined;
    }

    build(obj: object): Array<TagNode> {
        return Object.keys(obj).reduce<Array<TagNode>>((accumulator, key) => {
            const value = obj[key];
            const node = new TagNode(key);

            if (value != null && value instanceof Array) {
              node.children = value.map((e) => new TagNode(e))
            }

            return accumulator.concat(node);
        }, []);
    }
}