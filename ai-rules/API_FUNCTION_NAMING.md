## 基本規則
- _ を使用しないこと
  - _prefixやsuffix_
- $ を使用しないこと
  - サードパーティの命名規則に合わせる場合を除き、使用しないでください
- 型には型であることを示す名前を付けない
  - ~~Ifoo~~ また~~FooInterface~~
  - 既にtypeやinterfaceで示されていることを 2 重で表現しない
- 略語についてはプラットフォーム名(PHP, XML)で必要とされない限り、loadHTTPURLではなくloadHttpUrl を使用する

## 変数(variable / property)
- 変数には、lowerCamelCaseを使います。
```
let fooVar = { hogeFuga: "fuga" };
```

## クラス名(class)

クラス名にはUpperCamelCaseを使います。

```
class Foo {
  private static readonly MY_SPECAL_NUMBER = 5;

  bar() {
    return 2 * Foo.MY_SPECAL_NUMBER;
  }
}
```

## 関数(function / parameter )

関数には、lowerCamelCaseを使います。

メンバの場合は、クラス名と似ているのでlowerCamelCaseを使います。

```
function barFunc(barParam: string) {}
```

## 型(type/interface)
型には、UpperCamelCaseを使います。

```
interface Foo {}
type Bar = {};
```

## 定数(グローバルな定数)
グローバルな定数はEnum を含めてUPPER_SNAKE_CASE を使います。
API_BASE_URL = "https://example.com/api";