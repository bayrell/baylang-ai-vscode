export function apply(object, method_name, args)
{
    var method = object[method_name].bind(object);
    return method.apply(null, args);
}
export function callback(object, method){
    return (...args) =>
    {
        return apply(object, method, args);
    }
}