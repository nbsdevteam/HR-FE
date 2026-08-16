import type { DbDepartment, DbEmployee, DbPosition } from "@/shared/hooks";
import { empDisplayName } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode, PositionNode } from "../types";
import { avatarColors, CLEVEL_COLOR, defaultDeptColorMap, OWNER_COLOR } from "../styles";

export const pickUniqueColor = (usedColors: Set<string>): string => {
  for (const color of avatarColors) {
    if (!usedColors.has(color)) return color;
  }
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
};

export const buildOrgTree = (
  employees: DbEmployee[],
  departments: DbDepartment[],
): { tree: OrgNode; deptColors: Record<string, string> } => {
  const dColors: Record<string, string> = { ...defaultDeptColorMap };
  departments.forEach((department) => { if (department.color) dColors[department.name] = department.color; });

  const usedColors = new Set<string>(Object.values(dColors));
  const allDeptNames = new Set<string>();
  employees.forEach((employee) => { if (employee.department) allDeptNames.add(employee.department); });
  allDeptNames.forEach((departmentName) => {
    if (!dColors[departmentName]) {
      const color = pickUniqueColor(usedColors);
      dColors[departmentName] = color;
      usedColors.add(color);
    }
  });

  const nodeMap = new Map<string, OrgNode>();
  const childrenMap = new Map<string, string[]>();

  employees.forEach((employee) => {
    const name = empDisplayName(employee);
    nodeMap.set(employee.id, {
      id: employee.person_id,
      dbId: employee.id,
      name,
      initials: name.charAt(0),
      position: employee.position || employee.department || "—",
      department: employee.department || arabicSource("common.not_specified"),
      color: dColors[employee.department] || avatarColors[0],
      photo: employee.profile_picture || null,
      email: employee.email || null,
      children: [],
    });
    if (employee.manager_id) {
      if (!childrenMap.has(employee.manager_id)) childrenMap.set(employee.manager_id, []);
      childrenMap.get(employee.manager_id)!.push(employee.id);
    }
  });

  const attachChildren = (node: OrgNode) => {
    const childIds = childrenMap.get(node.dbId) || [];
    node.children = childIds.map((id) => nodeMap.get(id)).filter(Boolean) as OrgNode[];
    node.children.forEach(attachChildren);
  };

  const roots: OrgNode[] = [];
  employees.forEach((employee) => {
    if (!employee.manager_id || !nodeMap.has(employee.manager_id)) {
      const node = nodeMap.get(employee.id);
      if (node) roots.push(node);
    }
  });
  roots.forEach(attachChildren);

  const tree = roots.length === 1
    ? roots[0]
    : {
        id: 0,
        dbId: "__root__",
        name: arabicSource("common.foundation"),
        initials: arabicSource("common.m"),
        position: arabicSource("common.senior_management"),
        department: arabicSource("common.senior_management"),
        color: "#8B5CF6",
        photo: null,
        email: null,
        children: roots,
      };

  return { tree, deptColors: dColors };
};

export const buildOrgTreeFromPositions = (
  positions: DbPosition[],
  employees: DbEmployee[],
  departments: DbDepartment[],
): { tree: OrgNode; deptColors: Record<string, string> } => {
  const dColors: Record<string, string> = { ...defaultDeptColorMap };
  departments.forEach((department) => { if (department.color) dColors[department.name] = department.color; });
  const deptById: Record<string, DbDepartment> = {};
  departments.forEach((department) => { deptById[department.id] = department; });

  const usedColors = new Set<string>(Object.values(dColors));
  departments.forEach((department) => {
    if (!dColors[department.name]) {
      const color = pickUniqueColor(usedColors);
      dColors[department.name] = color;
      usedColors.add(color);
    }
  });

  const empsByPos: Record<string, DbEmployee[]> = {};
  employees.forEach((employee) => {
    if (employee.position_id) {
      if (!empsByPos[employee.position_id]) empsByPos[employee.position_id] = [];
      empsByPos[employee.position_id].push(employee);
    }
  });

  let nodeCounter = 1;
  const posNodeMap = new Map<string, OrgNode>();

  positions.filter((position) => position.is_active).forEach((position) => {
    const dept = position.department_id ? deptById[position.department_id] : null;
    const deptName = dept?.name || arabicSource("common.senior_management");
    const assignedEmps = empsByPos[position.id] || [];
    const primaryEmp = assignedEmps[0];
    const isVacant = assignedEmps.length === 0;
    const isTopLevel = position.level === 0;
    const color = isTopLevel ? OWNER_COLOR : (dColors[deptName] || avatarColors[0]);
    const name = isVacant ? arabicSource("common.vacant") : empDisplayName(primaryEmp);

    posNodeMap.set(position.id, {
      id: nodeCounter++,
      dbId: isVacant ? `pos_${position.id}` : primaryEmp.id,
      name,
      initials: name.charAt(0),
      position: position.title_ar,
      department: deptName,
      color,
      photo: isVacant ? null : (primaryEmp.profile_picture || null),
      email: isVacant ? null : (primaryEmp.email || null),
      children: [],
      isVacant,
      positionId: position.id,
      assignedEmployees: assignedEmps.map((employee) => ({
        id: employee.id,
        name: empDisplayName(employee),
        photo: employee.profile_picture || null,
      })),
      headcount: { current: assignedEmps.length, max: position.max_headcount },
    });
  });

  const roots: OrgNode[] = [];
  positions.filter((position) => position.is_active).forEach((position) => {
    const node = posNodeMap.get(position.id);
    if (!node) return;
    if (position.reports_to_position_id && posNodeMap.has(position.reports_to_position_id)) {
      posNodeMap.get(position.reports_to_position_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const tree = roots.length === 1
    ? roots[0]
    : {
        id: 0,
        dbId: "__root__",
        name: arabicSource("common.foundation"),
        initials: arabicSource("common.m"),
        position: arabicSource("common.senior_management"),
        department: arabicSource("common.senior_management"),
        color: OWNER_COLOR,
        photo: null,
        email: null,
        children: roots,
      };

  return { tree, deptColors: dColors };
};

export const getUnlinkedEmployees = (employees: DbEmployee[]): DbEmployee[] => {
  const idSet = new Set(employees.map((employee) => employee.id));
  return employees.filter((employee) => employee.manager_id && !idSet.has(employee.manager_id));
};

export const countDescendants = (node: OrgNode): number => {
  let count = node.children.length;
  for (const child of node.children) count += countDescendants(child);
  return count;
};

export const flattenTree = (node: OrgNode): OrgNode[] => {
  const result: OrgNode[] = [node];
  for (const child of node.children) result.push(...flattenTree(child));
  return result;
};

export const findAncestorIds = (root: OrgNode, targetId: number): number[] => {
  const path: number[] = [];
  const walk = (node: OrgNode): boolean => {
    if (node.id === targetId) return true;
    for (const child of node.children) {
      if (walk(child)) {
        path.push(node.id);
        return true;
      }
    }
    return false;
  };
  walk(root);
  return path;
};

export const findParentOf = (root: OrgNode, targetId: number): OrgNode | null => {
  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentOf(child, targetId);
    if (found) return found;
  }
  return null;
};

export const getDescendantIds = (node: OrgNode): Set<number> => {
  const ids = new Set<number>();
  const walk = (n: OrgNode) => {
    n.children.forEach((child) => {
      ids.add(child.id);
      walk(child);
    });
  };
  walk(node);
  return ids;
};

export const buildPositionTree = (
  positions: DbPosition[],
  employees: DbEmployee[],
): PositionNode[] => {
  const posMap = new Map<string, PositionNode>();
  const roots: PositionNode[] = [];

  positions.forEach((position) => {
    const assignedEmployees = employees.filter((employee) => employee.position_id === position.id);
    posMap.set(position.id, { ...position, children: [], assignedEmployees });
  });

  positions.forEach((position) => {
    const node = posMap.get(position.id);
    if (!node) return;
    if (position.reports_to_position_id && posMap.has(position.reports_to_position_id)) {
      posMap.get(position.reports_to_position_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => a.level - b.level || ((a as any).sequence || 0) - ((b as any).sequence || 0));
};
